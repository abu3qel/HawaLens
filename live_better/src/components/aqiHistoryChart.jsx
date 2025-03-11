import React, { useState, useEffect } from "react";
import { fetchAQIHistory } from "../api/fetchPollutionData";
import { getCoordinatesByCity } from "../api/geocodingUtils";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import CitySearch from "./CitySearch";

const timeOptions = [
  { label: "3 Days", value: 3 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "6 Months", value: 180 },
];

const AQI_BREAKPOINTS = {
  pm2_5: { good: 10, bad: 75 },
  pm10: { good: 20, bad: 200 },
  o3: { good: 60, bad: 180 },
  no2: { good: 40, bad: 200 },
  so2: { good: 20, bad: 350 },
  co: { good: 20, bad: 350 },
};

const AQIHistoryChart = ({ selectedCity, selectedCoordinates }) => {
  const [selectedRange, setSelectedRange] = useState(3);
  const [aqiData, setAqiData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCoordinates) {
      fetchData();
    }
  }, [selectedRange, selectedCoordinates]);

  const fetchData = async () => {
    setLoading(true);
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - selectedRange * 24 * 60 * 60;
    
    const data = await fetchAQIHistory(selectedCoordinates.lat, selectedCoordinates.lon, startTime, endTime);
    if (data && data.list) {
      const formattedData = data.list.map((entry) => ({
        time: new Date(entry.dt * 1000).toLocaleDateString(),
        aqi: entry.main.aqi,
        co: entry.components.co,
        no: entry.components.no,
        no2: entry.components.no2,
        o3: entry.components.o3,
        pm10: entry.components.pm10,
        pm2_5: entry.components.pm2_5,
        so2: entry.components.so2,
        nh3: entry.components.nh3,
      }));
      console.log(data);
      setAqiData(formattedData);
    }
    setLoading(false);
  };

  const chartData = {
    labels: aqiData.map((entry) => entry.time),
    datasets: Object.keys(AQI_BREAKPOINTS).map((pollutant) => ({
      label: pollutant.toUpperCase(),
      data: aqiData.map((entry) => entry[pollutant]),
      borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
      backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`,
      tension: 0.4,
    })).concat(
      Object.entries(AQI_BREAKPOINTS).flatMap(([pollutant, { bad }]) => [
        {
          label: `${pollutant.toUpperCase()} Bad`,
          data: Array(aqiData.length).fill(bad),
          borderColor: "rgba(255, 0, 0, 0.7)",
          borderDash: [5, 5],
          tension: 0,
        },
      ])
    ),
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg w-full text-black">
      <h2 className="text-lg font-bold mb-4">AQI & Pollutant Historical Data</h2>
      <p className="text-sm text-gray-500 mb-4">View air quality trends for the selected time range.</p>

      <div className="mb-4">
        <label className="mr-2 font-medium">Select Time Range:</label>
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          {timeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading AQI data...</p>
      ) : (
        <Line data={chartData} options={{ plugins: { legend: { position: 'right' } } }} />
      )}
    </div>
  );
};

export default AQIHistoryChart;
