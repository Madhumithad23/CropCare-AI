
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import tensorflow as tf
import numpy as np
import json
import os
import io

from PIL import Image


# ==========================================
# 1. CREATE FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="CropCare AI API",
    description="Backend for Smart Crop Health System",
    version="2.0"
)


# ==========================================
# 2. CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 3. LOAD TRAINED ML MODEL
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR, "Models", "tomato_disease_model.keras"
)

LABEL_PATH = os.path.join(
    BASE_DIR, "Models", "class_names.json"
)

IMG_SIZE = (128, 128)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

if not os.path.exists(LABEL_PATH):
    raise FileNotFoundError(f"Class labels not found: {LABEL_PATH}")

model = tf.keras.models.load_model(MODEL_PATH)

with open(LABEL_PATH, "r") as file:
    class_names = json.load(file)

print("CropCare AI ML model loaded successfully!")
print("Disease classes:", class_names)


# ==========================================
# 4. HOME ROUTE
# ==========================================

@app.get("/")
def home():
    return {
        "message": "CropCare AI Backend is Running!",
        "status": "success",
        "model": "Loaded"
    }


# ==========================================
# 5. HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


# ==========================================
# 6. IMAGE ANALYSIS FUNCTION
# ==========================================

def predict_disease(image_bytes):

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")
        image = image.resize(IMG_SIZE)

        image_array = np.array(image, dtype=np.float32)

        image_array = np.expand_dims(image_array, axis=0)

        predictions = model.predict(
            image_array,
            verbose=0
        )

        predicted_index = int(np.argmax(predictions[0]))

        confidence = float(predictions[0][predicted_index])

        disease_name = class_names[predicted_index]

        # Convert model label into readable text
        disease_name = disease_name.replace("Tomato___", "")
        disease_name = disease_name.replace("_", " ")

        return {
            "disease": disease_name,
            "confidence": round(confidence * 100, 2),
            "risk": "Requires agronomic assessment",
            "all_predictions": {
                class_names[i].replace("Tomato___", "").replace("_", " "):
                round(float(predictions[0][i]) * 100, 2)
                for i in range(len(class_names))
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Image analysis failed: {str(e)}"
        )


# ==========================================
# 7. CROP IMAGE ANALYSIS API
# ==========================================

@app.post("/analyze")
async def analyze_crop(
    image: UploadFile = File(...),
    crop: str = Form(...),
    location: str = Form(...),
    stage: str = Form(...)
):

    # This trained model currently supports tomato only
    if crop.strip().lower() != "tomato":
        raise HTTPException(
            status_code=400,
            detail="The current ML model supports tomato disease detection only."
        )

    # Read uploaded image
    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    # Run actual ML prediction
    analysis = predict_disease(image_bytes)

    return {
        "status": "success",
        "message": "Crop image analyzed successfully!",
        "crop": crop,
        "location": location,
        "stage": stage,
        "filename": image.filename,
        "analysis": analysis
    }
