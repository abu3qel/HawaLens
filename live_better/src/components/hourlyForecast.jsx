import React, { useState, useEffect } from "react";
import axios from "axios";
import { getHourlyForecast, getAirQuality } from "../api/fetchWeatherData";
import { fetchAQIForecast } from "../api/fetchPollutionData";

const HourlyForecast = ({ selectedCity, selectedCoordinates }) => {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aqiPredictions, setAqiPredictions] = useState([]);

  useEffect(() => {
    if (selectedCoordinates) {
      fetchHourlyForecast(selectedCoordinates.lat, selectedCoordinates.lon);
    }
  }, [selectedCoordinates]);

  const fetchHourlyForecast = async (lat, lon) => {
    setLoading(true);
    try {
      const hourlyResponse = await getHourlyForecast(lat, lon);
      const airQualityResponse = await fetchAQIForecast(lat, lon);
      const forecastData = {
        hourly: hourlyResponse.list.slice(0, 96).map(hour => ({
          dt: hour.dt,
          main: {
            temp: hour.main.temp,
            humidity: hour.main.humidity,
            pressure: hour.main.pressure
          },
          wind: {
            speed: hour.wind.speed
          },
          rain: hour.rain ? { '1h': hour.rain['1h'] || 0 } : undefined
        })),
        air: airQualityResponse.list || [],
        currentPM25: airQualityResponse.list[0]?.components?.pm2_5 || 10
      };

      console.log(airQualityResponse, "air quality response");

      // console.log("Hourly Response:", hourlyResponse);
      const aqiResponse = await axios.post("http://127.0.0.1:5001/predict_aqi", { forecastData });

      if (hourlyResponse && hourlyResponse.list && aqiResponse.data.forecast) {
        const formattedHourly = hourlyResponse.list.slice(0, 96).map((hour, index) => {
          const aqiData = aqiResponse.data.forecast[index] || { aqi: null, main_pollutant: "Unknown" };

          return {
            dt: hour.dt,
            date: new Date(hour.dt * 1000).toLocaleDateString("en-US", { weekday: "long" }),
            time: new Date(hour.dt * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
            temp: Math.round(hour.main.temp),
            windSpeed: Math.round(hour.wind.speed),
            humidity: hour.main.humidity,
            icon: `https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`,
            aqi: typeof aqiData.aqi === "number" ? aqiData.aqi : null, // Ensure numeric AQI
            mainPollutant: aqiData.main_pollutant || "Unknown",
          };
        });

        setForecastData(formattedHourly);
      }
    } catch (error) {
      console.error("Error fetching hourly forecast:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg scrollbar-none shadow-lg w-full text-black">
      <h2 className="text-lg font-bold mb-4">4-Day Hourly Forecast</h2>
      <p className="text-sm text-gray-500 mb-6">{selectedCity} air quality and weather forecast</p>
      {loading ? (
        <p className="text-center text-gray-500">Loading hourly forecast...</p>
      ) : (
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex space-x-6">
            {forecastData.map((hour, index) => {
              const prevHour = forecastData[index - 1];
              const isNewDay = !prevHour || prevHour.date !== hour.date;

              return (
                <React.Fragment key={index}>
                  {isNewDay && (
                    <div className="flex flex-col items-center mx-4">
                      <span className="text-md font-bold mb-2">{hour.date}</span>
                      <div className="border-l-2 border-gray-300 h-full"></div>
                    </div>
                  )}
                  <div className="flex flex-col items-center p-4 rounded-lg w-24 min-w-[80px]">
                    <span className="font-semibold text-lg whitespace-nowrap">{hour.time}</span>
                    <span
                      className="px-4 py-2 rounded-md text-white font-semibold min-w-[70px] text-center"
                      style={{ backgroundColor: hour.aqi !== null && hour.aqi > 50 ? "#FFC107" : "#8BC34A" }}
                    >
                      AQI: {hour.aqi !== null ? hour.aqi.toFixed(2) : "N/A"}
                    </span>
                    <img src={hour.icon} alt="weather icon" className="w-8" />
                    <span className="text-lg">{hour.temp}°</span>
                    <span className="flex flex-col items-center">
                      <span>{hour.windSpeed}</span>
                      <span className="text-sm text-gray-500">km/h</span>
                    </span>
                    <span>{hour.humidity}%</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HourlyForecast;
