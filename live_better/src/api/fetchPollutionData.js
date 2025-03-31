import axios from "axios";

const API_KEY = "554ac7e911b71cd3a8d0673582e1fa5e";
const BASE_URL = "https://api.openweathermap.org/data/2.5/air_pollution";

/**
 * Fetches current air pollution data for given coordinates.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>}
 */
export const fetchCurrentAQI = async (lat, lon) => {
  try {
    const response = await axios.get(`/api/aqi?lat=${lat}&lon=${lon}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching current AQI:", error);
    return null;
  }
};

/**
 * Fetches air pollution forecast for the next 5 days (3-hour intervals).
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>}
 */
export const fetchAQIForecast = async (lat, lon) => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching AQI forecast:", error);
    return null;
  }
};

/**
 * Fetches historical air pollution data for a given time range.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} start - Start timestamp (Unix format)
 * @param {number} end - End timestamp (Unix format)
 * @returns {Promise<Object|null>}
 */
export const fetchAQIHistory = async (lat, lon, start, end) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching AQI history:", error);
    return null;
  }
};
