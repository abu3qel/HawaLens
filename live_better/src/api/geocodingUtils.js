import axios from "axios";

const API_KEY = "554ac7e911b71cd3a8d0673582e1fa5e";
const BASE_URL = "https://api.openweathermap.org/geo/1.0";

/**
 * Fetches latitude & longitude for a given city name.
 * @param {string} cityName - Name of the city
 * @returns {Promise<Object|null>}
 */
export const getCoordinatesByCity = async (cityName) => {
  try {
    const response = await axios.get(`${BASE_URL}/direct?q=${cityName}&limit=1&appid=${API_KEY}`);
    console.log(response.data);
    if (response.data.length > 0) {
      return response.data[0]; // Return first match
    }
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};

/**
 * Fetches city details by latitude & longitude.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>}
 */
export const getCityByCoordinates = async (lat, lon) => {
  try {
    const response = await axios.get(`${BASE_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
    if (response.data.length > 0) {
      return response.data[0]; // Return first match
    }
    return null;
  } catch (error) {
    console.error("Error fetching city by coordinates:", error);
    return null;
  }
};

/**
 * Fetches a list of city suggestions for autocomplete.
 * @param {string} query - User's search input
 * @returns {Promise<Array>}
 */
export const getCitySuggestions = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/direct?q=${query}&limit=5&appid=${API_KEY}`);
    return response.data; // Returns an array of location suggestions
  } catch (error) {
    console.error("Error fetching city suggestions:", error);
    return [];
  }
};
