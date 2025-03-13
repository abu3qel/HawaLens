import axios from "axios";

const API_KEY = "554ac7e911b71cd3a8d0673582e1fa5e";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * Fetches a 16-day weather forecast.
 * @param {number} lat - Latitude of the location.
 * @param {number} lon - Longitude of the location.
 * @param {string} units - Measurement units (standard, metric, imperial).
 * @param {string} lang - Language for the response.
 * @returns {Promise<Object>} 16-day weather forecast data.
 */
export const get16DayForecast = async (lat, lon, units = "metric", lang = "en") => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast/daily`, {
      params: { lat, lon, cnt: 16, appid: API_KEY, units, lang },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fetches an hourly weather forecast for the next 48 hours.
 * @param {number} lat - Latitude of the location.
 * @param {number} lon - Longitude of the location.
 * @param {string} units - Measurement units.
 * @param {string} lang - Language for the response.
 * @returns {Promise<Object>} Hourly forecast data.
 */
export const getHourlyForecast = async (lat, lon, units = "metric", lang = "en") => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast/hourly`, {
      params: { lat, lon, appid: API_KEY, units, lang },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fetches air quality index (AQI) data.
 * @param {number} lat - Latitude of the location.
 * @param {number} lon - Longitude of the location.
 * @returns {Promise<Object>} Air quality data.
 */
export const getAirQuality = async (lat, lon) => {
  try {
    const response = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution`, {
      params: { lat, lon, appid: API_KEY },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fetches a weather overview (summary for today and tomorrow).
 * @param {number} lat - Latitude of the location.
 * @param {number} lon - Longitude of the location.
 * @param {string} date - Date in YYYY-MM-DD format (optional).
 * @param {string} units - Measurement units.
 * @returns {Promise<Object>} Weather overview.
 */
export const getWeatherOverview = async (lat, lon, date = null, units = "metric") => {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/3.0/onecall/overview`, {
      params: { lat, lon, appid: API_KEY, units, ...(date && { date }) },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Handles API errors and formats the response.
 * @param {Object} error - The API error response.
 * @returns {Object} Error message.
 */
const handleApiError = (error) => {
  return {
    error: `Request failed: ${error.response ? error.response.status : "Unknown"} - ${error.message}`,
  };
};
