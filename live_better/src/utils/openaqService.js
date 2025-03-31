// Updated openaqService.js with proper integration
import axios from 'axios';

const FLASK_BACKEND_URL = 'http://localhost:5001';

// Function to fetch air quality stations from OpenAQ via Flask backend
export const fetchOpenAQStations = async (lon, lat, radius = 10000, limit = 100) => {
  try {
    const response = await axios.get(`${FLASK_BACKEND_URL}/api/stations`, {
      params: {
        lon,
        lat,
        radius,
        limit
      }
    });
    
    // Make sure we're handling the data structure correctly
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching OpenAQ stations:', error);
    throw error;
  }
};

// Function to search for OpenAQ locations via Flask backend
export const searchOpenAQLocations = async (searchParams) => {
  try {
    // Ensure we're passing the right parameters in the right format
    const response = await axios.get(`${FLASK_BACKEND_URL}/api/search`, {
      params: searchParams
    });
    
    // Make sure we're handling the data structure correctly
    return response.data.results || [];
  } catch (error) {
    console.error('Error searching OpenAQ locations:', error);
    throw error;
  }
};

// The rest of your service functions can remain the same
export const fetchCurrentAQI = async (lat, lon) => {
  try {
    const response = await axios.get(`${FLASK_BACKEND_URL}/api/aqi`, {
      params: { lat, lon }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching current AQI:', error);
    throw error;
  }
};

export const fetchAQIForecast = async (pollutantData) => {
  try {
    const response = await axios.post(`${FLASK_BACKEND_URL}/predict_aqi`, pollutantData);
    return response.data.forecast || [];
  } catch (error) {
    console.error('Error fetching AQI forecast:', error);
    throw error;
  }
};

export const getAQIDescription = (aqi) => {
  switch (aqi) {
    case 1: return 'Good';
    case 2: return 'Fair';
    case 3: return 'Moderate';
    case 4: return 'Poor';
    case 5: return 'Very Poor';
    default: return 'Unknown';
  }
};

export const getAQIColor = (aqi) => {
  switch (aqi) {
    case 1: return '#4CAF50'; // Good - Green
    case 2: return '#CDDC39'; // Fair - Light Green/Yellow
    case 3: return '#FFC107'; // Moderate - Amber
    case 4: return '#FF5722'; // Poor - Deep Orange
    case 5: return '#9C27B0'; // Very Poor - Purple
    default: return '#9E9E9E'; // Unknown - Grey
  }
};