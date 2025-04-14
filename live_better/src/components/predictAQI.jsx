import React, { useState, useEffect } from "react";
import axios from "axios";
import { fetchAQIHistory } from "../api/fetchPollutionData";

const PredictAQI = ({ selectedCity, selectedCoordinates }) => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [latestProcessedData, setLatestProcessedData] = useState(null);

  // Fetch AQI history when city or coordinates change
  useEffect(() => {
    if (selectedCoordinates) {
      fetchAndProcessAQIData();
    }
  }, [selectedCoordinates]);

  const fetchAndProcessAQIData = async () => {
    setLoading(true);
    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - 7 * 24 * 60 * 60;

      const data = await fetchAQIHistory(
        selectedCoordinates.lat,
        selectedCoordinates.lon,
        startTime,
        endTime
      );

      if (data && data.list && data.list.length >= 24) {
        // Extract time-sorted list
        const sortedData = data.list.sort((a, b) => a.dt - b.dt);
        
        console.log("Sorted Data:", sortedData);
        // Convert to array of pollutant values
        const pollutants = sortedData.map((entry) => ({
          dt: entry.dt,
          co: entry.components.co,
          no2: entry.components.no2,
          o3: entry.components.o3,
          pm10: entry.components.pm10,
          pm25: entry.components.pm2_5,
          so2: entry.components.so2,
          temperature: entry.main.temp || 20, // Default to 20°C if missing
        }));

        // Compute 7-day rolling averages
        const rollingAverages = pollutants.map((entry, index) => {
          const slice = pollutants.slice(Math.max(0, index - 24 * 7), index + 1);
          const avg = (key) =>
            slice.length > 0
              ? slice.reduce((sum, e) => sum + (e[key] || 0), 0) / slice.length
              : 0;

          return {
            dt: entry.dt,
            co_7d_roll: avg("co"),
            no2_7d_roll: avg("no2"),
            o3_7d_roll: avg("o3"),
            pm10_7d_roll: avg("pm10"),
            pm25_7d_roll: avg("pm25"),
            so2_7d_roll: avg("so2"),
          };
        });

        // Compute lag features (previous hour's value)
        const processedData = rollingAverages.map((entry, index) => ({
          dt: entry.dt,
          co: pollutants[index]?.co || 0,
          no2: pollutants[index]?.no2 || 0,
          o3: pollutants[index]?.o3 || 0,
          pm10: pollutants[index]?.pm10 || 0,
          pm25: pollutants[index]?.pm25 || 0,
          so2: pollutants[index]?.so2 || 0,
          temperature: pollutants[index]?.temperature || 20,
          co_7d_roll: entry.co_7d_roll,
          no2_7d_roll: entry.no2_7d_roll,
          o3_7d_roll: entry.o3_7d_roll,
          pm10_7d_roll: entry.pm10_7d_roll,
          pm25_7d_roll: entry.pm25_7d_roll,
          so2_7d_roll: entry.so2_7d_roll,
          co_lag1: index > 0 ? pollutants[index - 1].co : entry.co_7d_roll,
          no2_lag1: index > 0 ? pollutants[index - 1].no2 : entry.no2_7d_roll,
          o3_lag1: index > 0 ? pollutants[index - 1].o3 : entry.o3_7d_roll,
          pm10_lag1: index > 0 ? pollutants[index - 1].pm10 : entry.pm10_7d_roll,
          pm25_lag1: index > 0 ? pollutants[index - 1].pm25 : entry.pm25_7d_roll,
          so2_lag1: index > 0 ? pollutants[index - 1].so2 : entry.so2_7d_roll,
        }));

        setLatestProcessedData(processedData[processedData.length - 1]);
      }
    } catch (error) {
      console.error("Failed to fetch or process AQI data:", error);
    }
    setLoading(false);
  };

  const predictAQI = async () => {
    setLoading(true);
    const response = await axios.post("http://127.0.0.1:5001/predict", latestProcessedData);
    setPredictions(response.data.predictions);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={predictAQI} disabled={loading}>
        Predict AQI
      </button>
      {predictions && Object.keys(predictions).map((key) => (
        <p key={key}>{key.toUpperCase()}: {predictions[key].toFixed(2)}</p>
      ))}
    </div>
  );
};

export default PredictAQI;
