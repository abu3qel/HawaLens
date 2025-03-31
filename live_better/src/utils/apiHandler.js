import axios from "axios";

const BASE_URL = "http://api.openweathermap.org/data/2.5";
const API_KEY = "554ac7e911b71cd3a8d0673582e1fa5e";

/**
 * Fetches AQI data by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>} AQI data
 */
export const getAQIDataByCoordinates = async (lat, lon) => {
  try {
    const response = await axios.get(`${BASE_URL}/air_pollution`, {
      params: {
        lat,
        lon,
        appid: API_KEY
      }
    });
    
    if (response.data && response.data.list && response.data.list.length > 0) {
      return {
        aqi: response.data.list[0].main.aqi,
        components: response.data.list[0].components,
        coord: response.data.coord
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching AQI by coordinates:", error);
    return null;
  }
};

/**
 * Fetches AQI data for a city name
 * @param {string} cityName - City name
 * @returns {Promise<Object|null>} Full AQI data
 */
export const getAQIDataForCity = async (location) => {
  try {
    let lat, lon;
    
    // Check if location is in "lat,lon" format
    if (location.includes(',')) {
      [lat, lon] = location.split(',').map(Number);
    } else {
      // Otherwise treat as city name and geocode first
      const geoResponse = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`);
      if (geoResponse.data.length === 0) return null;
      ({ lat, lon } = geoResponse.data[0]);
    }
    
    // Then get AQI data
    const aqiResponse = await axios.get(`${BASE_URL}/air_pollution`, {
      params: { lat, lon, appid: API_KEY }
    });
    
    if (aqiResponse.data?.list?.length > 0) {
      return {
        currentAQI: {
          list: aqiResponse.data.list,  // Keep the original structure
          aqi: aqiResponse.data.list[0].main.aqi,  // Also include direct aqi for convenience
          components: aqiResponse.data.list[0].components,
          coord: aqiResponse.data.coord
        },
        coordinates: { lat, lon }
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching AQI data:", error);
    return null;
  }
};