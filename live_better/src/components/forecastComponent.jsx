import React, { useState, useEffect } from "react";
import { get16DayForecast, getHourlyForecast, getAirQuality } from "../api/fetchWeatherData";

const ForecastComponent = ({ selectedCity, selectedCoordinates }) => {
  const [dailyForecast, setDailyForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCoordinates) {
      fetchForecast(selectedCoordinates.lat, selectedCoordinates.lon);
    }
  }, [selectedCoordinates]);

  const fetchForecast = async (lat, lon) => {
    setLoading(true);
    try {
      const dailyResponse = await get16DayForecast(lat, lon);
      const hourlyResponse = await getHourlyForecast(lat, lon);
      const aqiResponse = await getAirQuality(lat, lon);

      if (dailyResponse && dailyResponse.list) {
        const formattedDaily = dailyResponse.list.slice(0, 7).map((day) => ({
          day: new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: "short" }),
          tempMax: Math.round(day.temp.max),
          tempMin: Math.round(day.temp.min),
          windSpeed: Math.round(day.speed),
          humidity: day.humidity,
          aqi: aqiResponse.list[0]?.main?.aqi || "N/A",
          icon: `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`
        }));

        setDailyForecast(formattedDaily);
      }

      if (hourlyResponse && hourlyResponse.list) {
        const formattedHourly = hourlyResponse.list.slice(0, 12).map((hour) => ({
          time: new Date(hour.dt * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" }),
          temp: Math.round(hour.main.temp),
          windSpeed: Math.round(hour.wind.speed),
          humidity: hour.main.humidity,
          icon: `https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`
        }));

        setHourlyForecast(formattedHourly);
      }
    } catch (error) {
      console.error("Error fetching forecast data:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg w-full text-black h-full flex flex-col">
      <h2 className="text-lg font-bold mb-2">Weather Forecast</h2>
      <p className="text-sm text-gray-500 mb-4">{selectedCity} air quality and weather forecast</p>

      {loading ? (
        <p className="text-center text-gray-500">Loading forecast...</p>
      ) : (
        <>
          <h3 className="text-md font-semibold">7-Day Forecast</h3>
          <div className="space-y-2 flex-1">
            {dailyForecast.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md">
                <span className="font-semibold w-16">{day.day}</span>
                <span
                  className="px-3 py-2 rounded-md text-white font-semibold"
                  style={{ backgroundColor: day.aqi > 2 ? "#8BC34A" : "#4CAF50" }}
                >
                  {day.aqi}
                </span>
                <img src={day.icon} alt="weather icon" className="w-8" />
                <span>{day.tempMax}° / {day.tempMin}°</span>
                <span className="flex flex-col items-center">
                  <span>{day.windSpeed}</span>
                  <span className="text-sm text-gray-500">km/h</span>
                </span>
                <span>{day.humidity}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ForecastComponent;
