
from flask import Flask, request, jsonify
import joblib
import pandas as pd
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
import os
import numpy as np
import requests
import torch
from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import numpy as np
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

MODEL_DIR = r"C:\Users\sa260\GRP1.ai\live_better\models"
OPENAQ_API_KEY = "89ccb65589d25ad1b7ac1152014318f21278e61170f6c81d085574977b602188"
OPENWEATHER_API_KEY = "554ac7e911b71cd3a8d0673582e1fa5e"
OPENAQ_API_BASE_URL = 'https://api.openaq.org/v3'
models = {}
for file in os.listdir(MODEL_DIR):
    if file.endswith("_model.pkl"):
        pollutant = file.replace("_model.pkl", "")  # Extract pollutant name
        models[pollutant] = joblib.load(os.path.join(MODEL_DIR, file))

# Extract feature names from one model (assuming all models were trained with the same features)
TRAINED_FEATURES = list(next(iter(models.values())).feature_names_in_)

print("Loaded Models:", list(models.keys()))
print("Loaded Model Features:", TRAINED_FEATURES)
class ContinualLSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size=64, num_layers=2, dropout=0.2):
        super(ContinualLSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        self.bn1 = nn.BatchNorm1d(hidden_size)
        self.fc1 = nn.Linear(hidden_size, 32)
        self.bn2 = nn.BatchNorm1d(32)
        self.dropout1 = nn.Dropout(dropout)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)
        
    def forward(self, x):
        x = x.unsqueeze(1)
        lstm_out, _ = self.lstm(x)
        lstm_out = lstm_out[:, -1, :]
        lstm_out = self.bn1(lstm_out)
        out = self.fc1(lstm_out)
        out = self.bn2(out)
        out = self.dropout1(out)
        out = self.relu(out)
        out = self.fc2(out)
        return out
    


MODEL_PATH = r"C:\Users\sa260\GRP1.ai\live_better\models\pm25_model.pt"
model = torch.load(MODEL_PATH, map_location=torch.device('cpu'), weights_only=False)
model.eval()

# AQI Breakpoints (Same as Frontend)
AQI_BREAKPOINTS = {
    "pm2_5": [
        {"BPLo": 0, "BPHi": 12, "ILo": 0, "IHi": 50},
        {"BPLo": 12.1, "BPHi": 35.4, "ILo": 51, "IHi": 100},
        {"BPLo": 35.5, "BPHi": 55.4, "ILo": 101, "IHi": 150},
        {"BPLo": 55.5, "BPHi": 150.4, "ILo": 151, "IHi": 200},
    ],
    "pm10": [
        {"BPLo": 0, "BPHi": 54, "ILo": 0, "IHi": 50},
        {"BPLo": 55, "BPHi": 154, "ILo": 51, "IHi": 100},
        {"BPLo": 155, "BPHi": 254, "ILo": 101, "IHi": 150},
    ],
    "o3": [
        {"BPLo": 0, "BPHi": 0.054, "ILo": 0, "IHi": 50},
        {"BPLo": 0.055, "BPHi": 0.070, "ILo": 51, "IHi": 100},
        {"BPLo": 0.071, "BPHi": 0.085, "ILo": 101, "IHi": 150},
    ],
    "no2": [
        {"BPLo": 0, "BPHi": 53, "ILo": 0, "IHi": 50},
        {"BPLo": 54, "BPHi": 100, "ILo": 51, "IHi": 100},
        {"BPLo": 101, "BPHi": 360, "ILo": 101, "IHi": 150},
    ],
    "so2": [
        {"BPLo": 0, "BPHi": 35, "ILo": 0, "IHi": 50},
        {"BPLo": 36, "BPHi": 75, "ILo": 51, "IHi": 100},
        {"BPLo": 76, "BPHi": 185, "ILo": 101, "IHi": 150},
    ],
    "co": [
        {"BPLo": 0, "BPHi": 4.4, "ILo": 0, "IHi": 50},
        {"BPLo": 4.5, "BPHi": 9.4, "ILo": 51, "IHi": 100},
        {"BPLo": 9.5, "BPHi": 12.4, "ILo": 101, "IHi": 150},
    ],
}

def calculate_aqi(pollutant, concentration):
    """Calculate AQI using μg/m³ values for O3"""
    if pollutant not in AQI_BREAKPOINTS or concentration is None:
        return None
    
    for bp in AQI_BREAKPOINTS[pollutant]:
        if bp["BPLo"] <= concentration <= bp["BPHi"]:
            return round(((bp["IHi"] - bp["ILo"]) / (bp["BPHi"] - bp["BPLo"])) * (concentration - bp["BPLo"]) + bp["ILo"])

    return AQI_BREAKPOINTS[pollutant][-1]["IHi"]

FEATURE_ORDER = [
    'temperature',
    'relative_humidity_2m',
    'wind_speed_10m',
    'surface_pressure',
    'precipitation',
    'no2',
    'o3',
    'pm10',
    'co',
    'so2',
    'pm1',
    'pm25_lag_1',
    'pm25_lag_2',
    'pm25_lag_3'
]
@app.route('/predict_aqi', methods=['POST'])
def predict_aqi():
    try:
        # Parse and validate input data
        data = request.json
        print("Received data:", data)
        # if not data:
        #     return jsonify({"error": "Missing request data"}), 400
            
        if 'forecastData' not in data:
            return jsonify({"error": "Missing forecastData in request"}), 400
        
        if 'hourly' not in data['forecastData'] or 'air' not in data['forecastData']:
            return jsonify({"error": "Missing hourly weather or air quality data"}), 400
        
        hourly_weather = data['forecastData']['hourly'][:96]
        aqi_forecast = data['forecastData']['air'][:96]

        print(aqi_forecast)
        
        if not hourly_weather or not aqi_forecast:
            return jsonify({"error": "Empty weather or air quality forecast data"}), 400
        
        print("Processing forecast data...")
        predictions = []
        current_values = {
            'pm25': data.get('currentPM25', 10),
            'no2': aqi_forecast[0]['components']['no2'] if aqi_forecast else 0,
            'o3': aqi_forecast[0]['components']['o3'] if aqi_forecast else 0,
            'pm10': aqi_forecast[0]['components']['pm10'] if aqi_forecast else 0,
            'co': aqi_forecast[0]['components']['co'] if aqi_forecast else 0,
            'so2': aqi_forecast[0]['components']['so2'] if aqi_forecast else 0
        }

        for i in range(min(len(hourly_weather), len(aqi_forecast))):
            try:
                hour_weather = hourly_weather[i]
                hour_pollution = aqi_forecast[i]
                
                # Validate timestamp data
                if 'dt' not in hour_weather:
                    raise ValueError(f"Missing timestamp in weather data at index {i}")
                    
                # Prepare features for PM2.5 prediction using weather data
                dt = datetime.fromtimestamp(hour_weather.get('dt'))
                features = {
                    'year': dt.year,
                    'month': dt.month,
                    'day': dt.day,
                    'dayofweek': dt.weekday(),
                    'hour': dt.hour,
                    'temperature': hour_weather.get('temp', hour_weather.get('main', {}).get('temp', 20)),
                    'relative_humidity_2m': hour_weather.get('humidity', hour_weather.get('main', {}).get('humidity', 50)),
                    'wind_speed_10m': hour_weather.get('wind_speed', hour_weather.get('wind', {}).get('speed', 0)),
                    'surface_pressure': hour_weather.get('pressure', hour_weather.get('main', {}).get('pressure', 1013)),
                    'precipitation': hour_weather.get('rain', {}).get('1h', 0) if 'rain' in hour_weather else 0,
                    'no2': current_values['no2'],
                    'o3': current_values['o3'],
                    'pm10': current_values['pm10'],
                    'co': current_values['co'],
                    'so2': current_values['so2'],
                    'pm25_lag_1': current_values['pm25'],
                    'pm25_lag_2': current_values['pm25'],
                    'pm25_lag_3': current_values['pm25']
                }

                # Check for missing feature 'pm1'
                if 'pm1' not in features and 'pm1' in FEATURE_ORDER:
                    features['pm1'] = 0  # Default value if missing

                # Predict PM2.5 using model
                try:
                    input_features = np.array([features.get(k, 0) for k in FEATURE_ORDER], dtype=np.float32)
                    input_tensor = torch.from_numpy(input_features).unsqueeze(0)
                    
                    with torch.no_grad():
                        pm25_pred = max(0, model(input_tensor).item())
                        current_values['pm25'] = pm25_pred
                except Exception as model_error:
                    raise RuntimeError(f"Error during model prediction: {str(model_error)}")

                # Get other pollutants from air pollution forecast
                if 'components' not in hour_pollution:
                    raise ValueError(f"Missing components in air quality data at index {i}")
                    
                components = hour_pollution.get('components', {})
                pollutant_values = {
                    'pm25': pm25_pred,  # Our prediction
                    'no2': components.get('no2', current_values['no2']),
                    'o3': components.get('o3', current_values['o3']),
                    'pm10': components.get('pm10', current_values['pm10']),
                    'co': components.get('co', current_values['co']),
                    'so2': components.get('so2', current_values['so2'])
                }

                # Calculate AQI values
                aqi_values = {
                    'pm25': calculate_aqi('pm2_5', pollutant_values['pm25']),
                    'no2': calculate_aqi('no2', pollutant_values['no2']),
                    'o3': calculate_aqi('o3', pollutant_values['o3'] / 1996),  # Convert to ppm
                    'pm10': calculate_aqi('pm10', pollutant_values['pm10']),
                    'co': calculate_aqi('co', pollutant_values['co']/1000),
                    'so2': calculate_aqi('so2', pollutant_values['so2'])
                }

                print(f"O3 Calculation Debug: {pollutant_values['o3']}μg/m³ -> AQI {aqi_values['o3']}")
                print(f"All AQI Values: {aqi_values}")
                                
                # Determine overall AQI
                if not aqi_values or all(v is None for v in aqi_values.values()):
                    raise ValueError(f"Failed to calculate any valid AQI values at index {i}")
                    
                valid_aqi_values = {k: v for k, v in aqi_values.items() if v is not None}
                overall_aqi = max(valid_aqi_values.values()) if valid_aqi_values else None
                main_pollutant = max(valid_aqi_values.items(), key=lambda x: x[1])[0] if valid_aqi_values else "pm25"
                print(valid_aqi_values, "valid_aqiVlaue")
                print(main_pollutant, "main_pollutant")
                print("actual pm24", pollutant_values['pm25'])
                predictions.append({
                    "dt": hour_weather['dt'],
                    "aqi": overall_aqi,
                    "main_pollutant": main_pollutant,
                    "pollutants": pollutant_values,
                    "aqi_breakdown": aqi_values,
                    "original_aqi": hour_pollution.get('main', {}).get('aqi')
                })

                # Update current values
                current_values.update({
                    'no2': pollutant_values['no2'],
                    'o3': pollutant_values['o3'],
                    'pm10': pollutant_values['pm10'],
                    'co': pollutant_values['co'],
                    'so2': pollutant_values['so2']
                })
                
            except ValueError as ve:
                print(f"Value error at hour {i}: {str(ve)}")
                continue  # Skip this hour but continue processing
            except RuntimeError as re:
                print(f"Runtime error at hour {i}: {str(re)}")
                continue  # Skip this hour but continue processing
            except Exception as hour_error:
                print(f"Unexpected error processing hour {i}: {str(hour_error)}")
                continue  # Skip this hour but continue processing

        if not predictions:
            return jsonify({"error": "Failed to generate any valid predictions"}), 500

        return jsonify({
            "forecast": predictions,
            "initial_values": current_values
        })

    except KeyError as ke:
        error_msg = f"Missing key in request data: {str(ke)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 400
    except ValueError as ve:
        error_msg = f"Invalid value in input data: {str(ve)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 400
    except TypeError as te:
        error_msg = f"Type error in data processing: {str(te)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 400
    except RuntimeError as re:
        error_msg = f"Runtime error in prediction: {str(re)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500
@app.route('/api/search', methods=['GET'])
def search_locations():
    """Proxy endpoint for searching OpenAQ locations"""
    try:
        # Get parameters from request
        location_name = request.args.get('locationName')
        radius = request.args.get('radius', 10000)
        
        print(f"Searching for: {location_name} with radius: {radius}")
        
        # First, get geocoding information for the location name
        # You can use OpenStreetMap's Nominatim service for this
        geocode_url = f"https://nominatim.openstreetmap.org/search?q={location_name}&format=json&limit=1"
        geocode_response = requests.get(geocode_url, headers={'User-Agent': 'AQI App'})
        
        if geocode_response.status_code != 200 or len(geocode_response.json()) == 0:
            return jsonify({'error': 'Location not found'}), 404
        
        # Extract coordinates
        location_data = geocode_response.json()[0]
        lat = location_data['lat']
        lon = location_data['lon']
        
        print(f"Found coordinates for {location_name}: lat={lat}, lon={lon}")
        
        # Add headers with API key
        headers = {
            'X-API-Key': OPENAQ_API_KEY
        }
        
        # Build request URL and params with coordinates
        url = f"{OPENAQ_API_BASE_URL}/locations"
        params = {
            'coordinates': f"{lat},{lon}",  # This is the key part
            'radius': radius,
            'limit': 100,
            'page': 1
        }
        
        print(f"Making request to OpenAQ API: {url}")
        print(f"With params: {params}")
        
        # Make request to OpenAQ API
        response = requests.get(
            url,
            params=params,
            headers=headers
        )
        
        print(f"OpenAQ API response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error response from OpenAQ: {response.text}")
            return jsonify({'error': f"OpenAQ API returned {response.status_code}: {response.text}"}), 500
        
        # Parse response data
        data = response.json()
        return jsonify(data)
        
    except Exception as e:
        print(f"Error in search_locations: {str(e)}")
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/stations', methods=['GET'])
def get_stations():
    """Endpoint for fetching OpenAQ stations near coordinates"""
    try:
        # Get parameters from request
        lon = request.args.get('lon')
        lat = request.args.get('lat')
        radius = request.args.get('radius', 10000)
        limit = request.args.get('limit', 100)
        
        if not lon or not lat:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        # Add headers with API key
        headers = {
            'X-API-Key': OPENAQ_API_KEY
        }
        
        # Build request URL with correct params
        url = f"{OPENAQ_API_BASE_URL}/locations"
        params = {
            'coordinates': f"{lat},{lon}",
            'radius': radius,
            'limit': limit,
            'page': 1
        }
        
        # Make request to OpenAQ API
        response = requests.get(
            url,
            params=params,
            headers=headers
        )
        
        if response.status_code != 200:
            return jsonify({'error': f"OpenAQ API returned {response.status_code}: {response.text}"}), 500
        
        # Return the data
        return jsonify(response.json())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/aqi', methods=['GET'])
def get_aqi():
    """Proxy endpoint for fetching current AQI data"""
    try:
        # Get and validate parameters from request
        lat = request.args.get('lat')
        lon = request.args.get('lon')

        if not lat or not lon:
            return jsonify({'error': 'Missing required parameters: lat and lon'}), 400

        # Convert to float and log
        lat = float(lat)
        lon = float(lon)
        print(f"Fetching AQI for coordinates: {lat}, {lon}")

        # Make request to OpenWeatherMap API
        response = requests.get(
            "http://api.openweathermap.org/data/2.5/air_pollution",
            params={
                'lat': lat,
                'lon': lon,
                'appid': OPENWEATHER_API_KEY  # Double-check this matches your working key
            },
            timeout=10
        )

        print(f"API Response Status: {response.status_code}")
        
        response.raise_for_status()
        data = response.json()
        print(f"API Response Data: {data}")
        
        return jsonify(data)
    
    except ValueError as e:
        return jsonify({'error': 'Invalid latitude/longitude format'}), 400
    except requests.exceptions.HTTPError as e:
        print(f"API Error: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch AQI data',
            'details': str(e),
            'status_code': e.response.status_code
        }), e.response.status_code
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    
import sendgrid
from sendgrid.helpers.mail import Mail

@app.route('/api/send-aqi-alert', methods=['POST'])
def send_aqi_alert():
    try:
        data = request.json
        
        recipient_email = data.get('email')
        location_name = data.get('locationName')
        aqi_level = data.get('aqi')
        
        if not all([recipient_email, location_name, aqi_level]):
            return jsonify({"error": "Missing parameters"}), 400

        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        
        message = Mail(
            from_email='hawalens.corp@gmail.com',
            to_emails=recipient_email,
            subject=f'AQI Alert: {location_name}',
            html_content=f"""
                <strong>Air Quality Alert</strong>
                <p>Location: {location_name}</p>
                <p>AQI Level: {aqi_level}</p>
            """
        )
        
        response = sg.send(message)
        return jsonify({"success": True, "status": response.status_code})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)