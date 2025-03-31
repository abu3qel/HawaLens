from flask import Flask, request, jsonify
import joblib
import pandas as pd
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
import os
import numpy as np
import requests

app = Flask(__name__)
CORS(app)

MODEL_DIR = "/Users/burakose/Desktop/AI/G1/Code/my-aqi-app/Models/"
OPENAQ_API_KEY = "89ccb65589d25ad1b7ac1152014318f21278e61170f6c81d085574977b602188"
OPENWEATHER_API_KEY = "554ac7e911b71cd3a8d0673582e1fa5e"
OPENAQ_API_BASE_URL = 'https://api.openaq.org/v3'


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
    """Calculate AQI using the same formula as the React frontend."""
    if pollutant not in AQI_BREAKPOINTS or concentration is None:
        return None
    
    for bp in AQI_BREAKPOINTS[pollutant]:
        if bp["BPLo"] <= concentration <= bp["BPHi"]:
            return round(((bp["IHi"] - bp["ILo"]) / (bp["BPHi"] - bp["BPLo"])) * (concentration - bp["BPLo"]) + bp["ILo"])

    return AQI_BREAKPOINTS[pollutant][-1]["IHi"]  # Max AQI if value is beyond range


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
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
