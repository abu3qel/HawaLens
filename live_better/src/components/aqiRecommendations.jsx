import React from "react";
import { FaRunning, FaMask, FaWindowClose } from "react-icons/fa";

// AQI Calculation Function
const calculateAQI = (Cp, breakpoints) => {
  const { BPLo, BPHi, ILo, IHi } = breakpoints;
  return Math.round(((IHi - ILo) / (BPHi - BPLo)) * (Cp - BPLo) + ILo);
};

// AQI Breakpoints
const AQI_BREAKPOINTS = {
  pm2_5: [
    { BPLo: 0, BPHi: 12, ILo: 0, IHi: 50 },
    { BPLo: 12.1, BPHi: 35.4, ILo: 51, IHi: 100 },
    { BPLo: 35.5, BPHi: 55.4, ILo: 101, IHi: 150 },
  ],
  pm10: [
    { BPLo: 0, BPHi: 54, ILo: 0, IHi: 50 },
    { BPLo: 55, BPHi: 154, ILo: 51, IHi: 100 },
    { BPLo: 155, BPHi: 254, ILo: 101, IHi: 150 },
  ],
  o3: [
    { BPLo: 0, BPHi: 0.054, ILo: 0, IHi: 50 },
    { BPLo: 0.055, BPHi: 0.070, ILo: 51, IHi: 100 },
  ],
};

// Function to get AQI for a pollutant
const getAQI = (pollutant, value) => {
  const breakpoints = AQI_BREAKPOINTS[pollutant];
  if (!breakpoints) return null;

  for (let i = 0; i < breakpoints.length; i++) {
    if (value >= breakpoints[i].BPLo && value <= breakpoints[i].BPHi) {
      return calculateAQI(value, breakpoints[i]);
    }
  }
  return null;
};

const AQIRecommendations = ({ data }) => {
  if (!data) return <p>No AQI data available</p>;

  const pollutants = data.list[0].components;
  const pollutantDetails = [
    { key: "pm2_5", label: "PM2.5" },
    { key: "pm10", label: "PM10" },
    { key: "o3", label: "O₃" },
  ].map((pollutant) => ({
    ...pollutant,
    aqi: getAQI(pollutant.key, pollutants[pollutant.key]),
  }));

  // Get highest AQI
  const highestAQI = pollutantDetails.reduce((max, p) => (p.aqi > max ? p.aqi : max), 0);
  const mainPollutant = pollutantDetails.find((p) => p.aqi === highestAQI);

  // Recommendations
  const recommendations = [
    {
      min: 0,
      max: 50,
      message: "Air quality is good. Enjoy outdoor activities!",
      icon: <FaRunning className="text-green-500" />,
    },
    {
      min: 51,
      max: 100,
      message: "Air quality is moderate. Sensitive groups should reduce outdoor activities.",
      icon: <FaRunning className="text-yellow-500" />,
    },
    {
      min: 101,
      max: 150,
      message: `Sensitive groups should wear a mask outdoors. (Main pollutant: ${mainPollutant?.label})`,
      icon: <FaMask className="text-orange-500" />,
    },
    {
      min: 151,
      max: 200,
      message: "Reduce outdoor exercise. Consider an air purifier indoors.",
      icon: <FaWindowClose className="text-red-500" />,
    },
  ];

  const recommendation = recommendations.find((rec) => highestAQI >= rec.min && highestAQI <= rec.max);

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <h2 className="text-xl font-bold text-gray-800">Health Recommendations</h2>
      {recommendation && (
        <div className="flex items-center space-x-4 mt-4">
          <div className="p-3 bg-orange-100 rounded-lg">{recommendation.icon}</div>
          <div>
            <p className="text-gray-800">{recommendation.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQIRecommendations;
