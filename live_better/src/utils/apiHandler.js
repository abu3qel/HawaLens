import { getCoordinatesByCity } from "../api/geocodingUtils";
import { fetchCurrentAQI, fetchAQIForecast } from "../api/fetchPollutionData";

/**
 * Fetches all AQI data after converting city name to coordinates.
 * @param {string} cityName - City name to search
 * @returns {Promise<Object|null>} - { location, currentAQI, forecastAQI }
 */
export const getAQIDataForCity = async (cityName) => {
  try {
    const location = await getCoordinatesByCity(cityName);
    if (!location) return null;

    const currentAQI = await fetchCurrentAQI(location.lat, location.lon);
    const forecastAQI = await fetchAQIForecast(location.lat, location.lon);

    return {
      location, // { lat, lon, name, country }
      currentAQI, // Current air pollution levels
      forecastAQI, // 5-day AQI forecast
    };
  } catch (error) {
    console.error("Error fetching full AQI data:", error);
    return null;
  }
};
