import React from "react";
import { getAQI } from "../utils/AQIUtils"; 

const AQICard = ({ data }) => {
  if (!data) return <p>No AQI data available</p>;

  const pollutants = data.list[0].components;

  // Calculate AQI for each pollutant
  const pollutantDetails = [
    { key: "pm2_5", label: "PM2.5", description: "Fine particles (≤ 2.5 µm)", color: "bg-orange-400" },
    { key: "pm10", label: "PM10", description: "Coarse particles (≤ 10 µm)", color: "bg-yellow-400" },
    { key: "o3", label: "O₃", description: "Ozone", color: "bg-green-400" },
    { key: "no2", label: "NO₂", description: "Nitrogen Dioxide", color: "bg-green-400" },
    { key: "so2", label: "SO₂", description: "Sulphur Dioxide", color: "bg-green-400" },
    { key: "co", label: "CO", description: "Carbon Monoxide", color: "bg-green-400" },
  ].map((pollutant) => ({
    ...pollutant,
    aqi: getAQI(pollutant.key, pollutants[pollutant.key]),
    value: pollutants[pollutant.key],
  }));

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg w-full">
      <h2 className="text-xl font-bold text-gray-800">Air Quality Index</h2>
      <div className="grid grid-cols-2 gap-5 mt-6">
        {pollutantDetails.map(({ key, label, description, color, value, aqi }) => (
          <div key={key} className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
            <p className="text-sm text-gray-500">{description}</p>
            <div className="flex items-center mt-2">
              <span className={`h-3 w-3 rounded-full ${color} mr-2`} />
              <span className="text-lg font-semibold text-gray-900">
                {value} µg/m³
              </span>
            </div>
            <p className="text-sm text-gray-600">AQI: {aqi}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AQICard;
