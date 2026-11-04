// ========================================
// CROPCARE AI - JAVASCRIPT
// ========================================

// ========================================
// 1. OPEN CROP SCANNER
// ========================================

function openScanner() {
  document.getElementById("scanner").scrollIntoView({
    behavior: "smooth",
  });
}

// ========================================
// 2. IMAGE PREVIEW
// ========================================

function previewImage(event) {
  const image = document.getElementById("preview");

  const file = event.target.files[0];

  if (file) {
    image.src = URL.createObjectURL(file);

    image.style.display = "block";
  }
}

// ========================================
// 3. CROP ANALYSIS
// ========================================

async function analyzeCrop() {
  const imageInput = document.getElementById("cropImage");

  const crop = document.getElementById("crop").value;

  const location = document.getElementById("cropLocation").value.trim();

  const stage = document.getElementById("cropStage").value;

  const result = document.getElementById("result");

  // Check image

  if (imageInput.files.length === 0) {
    result.innerHTML = "<p>⚠️ Please upload a crop image.</p>";

    return;
  }

  // Check crop

  if (crop === "") {
    result.innerHTML = "<p>⚠️ Please select your crop.</p>";

    return;
  }

  // Check location

  if (location === "") {
    result.innerHTML = "<p>⚠️ Please enter your location.</p>";

    return;
  }

  // Check crop stage

  if (stage === "") {
    result.innerHTML = "<p>⚠️ Please select the crop stage.</p>";

    return;
  }

  // Show loading message

  result.innerHTML = `

        <div class="analysis-result">

            <h3>🔄 Analyzing Crop...</h3>

            <p>
                Sending your crop image to
                CropCare AI...
            </p>

        </div>

    `;

  // Create FormData

  const formData = new FormData();

  formData.append("image", imageInput.files[0]);

  formData.append("crop", crop);

  formData.append("location", location);

  formData.append("stage", stage);

  try {
    // Send information to FastAPI

    const response = await fetch("http://172.16.12.74:8000/analyze", {
      method: "POST",
      body: formData,
    });

    // Check server response

    if (!response.ok) {
      throw new Error("Server returned an error");
    }

    // Convert response to JSON

    const data = await response.json();

    // Display result

    result.innerHTML = `

            <div class="analysis-result">

                <h3>🌱 Crop Analysis</h3>

                <p>
                    <strong>Crop:</strong>
                    ${data.crop}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${data.location}
                </p>

                <p>
                    <strong>Crop Stage:</strong>
                    ${data.stage}
                </p>

                <p>
                    <strong>Image:</strong>
                    ${data.filename}
                </p>

                <hr>

                <h3>🤖 AI Analysis</h3>

                <p>
                    <strong>Disease:</strong>
                    ${data.analysis.disease}
                </p>

                <p>
                    <strong>Confidence:</strong>
                    ${data.analysis.confidence}%
                </p>

                <p>
                    <strong>Risk:</strong>
                    ${data.analysis.risk}
                </p>

            </div>

        `;
  } catch (error) {
    console.error(error);

    result.innerHTML = `

            <div class="analysis-result">

                <h3>❌ Analysis Failed</h3>

                <p>
                    Unable to connect to
                    CropCare AI server.
                </p>

                <p>
                    Please make sure the
                    FastAPI backend is running.
                </p>

            </div>

        `;
  }
}

// ========================================
// 4. WEATHER
// ========================================

async function getWeather() {
  const locationInput = document.getElementById("location");

  const result = document.getElementById("weatherResult");

  const location = locationInput.value.trim();

  if (location === "") {
    result.innerHTML = "<p>⚠️ Please enter your location.</p>";

    return;
  }

  result.innerHTML = `

        <div class="weather-loading">

            <h3>🔄 Getting Weather Data...</h3>

            <p>
                Finding weather information for
                ${location}
            </p>

        </div>

    `;

  try {
    // Find location

    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
    );

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      result.innerHTML = `

                <div class="weather-error">

                    <h3>❌ Location Not Found</h3>

                    <p>
                        Please enter a valid city
                        or district name.
                    </p>

                </div>

            `;

      return;
    }

    const place = geoData.results[0];

    const latitude = place.latitude;

    const longitude = place.longitude;

    // Get weather

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,weather_code&timezone=auto`,
    );

    const weatherData = await weatherResponse.json();

    const current = weatherData.current;

    const temperature = current.temperature_2m;

    const humidity = current.relative_humidity_2m;

    const rain = current.rain;

    const wind = current.wind_speed_10m;

    // Crop weather risk

    let risk = "LOW";

    let riskMessage =
      "Current weather conditions show relatively low crop disease risk.";

    if (humidity >= 80 && temperature >= 20 && temperature <= 32) {
      risk = "HIGH";

      riskMessage =
        "High humidity and suitable temperature may increase the risk of certain crop diseases.";
    } else if (humidity >= 65 || rain > 0) {
      risk = "MEDIUM";

      riskMessage =
        "Weather conditions may support some crop pests or diseases. Monitor your crop regularly.";
    }

    // Display weather

    result.innerHTML = `

            <div class="weather-result">

                <h3>
                    📍 ${place.name}
                </h3>

                <p>
                    ${place.country}
                </p>


                <div class="weather-grid">


                    <div class="weather-item">

                        <span>🌡️</span>

                        <strong>
                            ${temperature} °C
                        </strong>

                        <small>
                            Temperature
                        </small>

                    </div>


                    <div class="weather-item">

                        <span>💧</span>

                        <strong>
                            ${humidity}%
                        </strong>

                        <small>
                            Humidity
                        </small>

                    </div>


                    <div class="weather-item">

                        <span>🌧️</span>

                        <strong>
                            ${rain} mm
                        </strong>

                        <small>
                            Rain
                        </small>

                    </div>


                    <div class="weather-item">

                        <span>💨</span>

                        <strong>
                            ${wind} km/h
                        </strong>

                        <small>
                            Wind Speed
                        </small>

                    </div>


                </div>


                <div class="risk-result">

                    <h3>
                        Crop Weather Risk:
                    </h3>

                    <h2>
                        ⚠️ ${risk}
                    </h2>

                    <p>
                        ${riskMessage}
                    </p>

                </div>


                <p class="weather-note">

                    📊 This is a preliminary
                    weather-based risk indicator.
                    The final system will combine
                    weather, crop history, location
                    and ML image analysis.

                </p>


            </div>

        `;
  } catch (error) {
    console.error(error);

    result.innerHTML = `

            <div class="weather-error">

                <h3>
                    ❌ Unable to Get Weather
                </h3>

                <p>
                    Please check your internet
                    connection and try again.
                </p>

            </div>

        `;
  }
}
