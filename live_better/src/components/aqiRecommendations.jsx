import React from "react";
import { FaRunning, FaWindowClose, FaMask, FaAirFreshener } from "react-icons/fa";

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
    { BPLo: 55.5, BPHi: 150.4, ILo: 151, IHi: 200 },
  ],
  pm10: [
    { BPLo: 0, BPHi: 54, ILo: 0, IHi: 50 },
    { BPLo: 55, BPHi: 154, ILo: 51, IHi: 100 },
    { BPLo: 155, BPHi: 254, ILo: 101, IHi: 150 },
  ],
  o3: [
    { BPLo: 0, BPHi: 0.054, ILo: 0, IHi: 50 },
    { BPLo: 0.055, BPHi: 0.070, ILo: 51, IHi: 100 },
    { BPLo: 0.071, BPHi: 0.085, ILo: 101, IHi: 150 },
  ],
  no2: [
    { BPLo: 0, BPHi: 53, ILo: 0, IHi: 50 },
    { BPLo: 54, BPHi: 100, ILo: 51, IHi: 100 },
    { BPLo: 101, BPHi: 360, ILo: 101, IHi: 150 },
  ],
  so2: [
    { BPLo: 0, BPHi: 35, ILo: 0, IHi: 50 },
    { BPLo: 36, BPHi: 75, ILo: 51, IHi: 100 },
    { BPLo: 76, BPHi: 185, ILo: 101, IHi: 150 },
  ],
  co: [
    { BPLo: 0, BPHi: 4.4, ILo: 0, IHi: 50 },
    { BPLo: 4.5, BPHi: 9.4, ILo: 51, IHi: 100 },
    { BPLo: 9.5, BPHi: 12.4, ILo: 101, IHi: 150 },
  ],
};

// Find the correct breakpoint range
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

  // Calculate AQI for each pollutant
  const pollutantDetails = [
    { key: "pm2_5", label: "PM2.5" },
    { key: "pm10", label: "PM10" },
    { key: "o3", label: "O₃" },
    { key: "no2", label: "NO₂" },
    { key: "so2", label: "SO₂" },
    { key: "co", label: "CO" },
  ].map((pollutant) => ({
    ...pollutant,
    aqi: getAQI(pollutant.key, pollutants[pollutant.key]),
  }));

  // Get highest AQI and main pollutant
  const highestAQI = pollutantDetails
  .filter((p) => p.aqi !== null && p.aqi !== undefined) // Ensure valid AQI values
  .reduce((max, p) => (p.aqi > max ? p.aqi : max), 0);

  console.log("highestAQI",highestAQI);
  const mainPollutant = pollutantDetails.find((p) => p.aqi === highestAQI);

  console.log("AQI Recalculated in Recommendations:", highestAQI, "Main Pollutant:", mainPollutant);

  // Define recommendations
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
      message: `Reduce outdoor exercise. Consider an air purifier indoors. (Main pollutant: ${mainPollutant?.label})`,
      icon: <FaAirFreshener className="text-red-500" />,
    },
    {
      min: 201,
      max: 300,
      message: "Close your windows to avoid dirty outdoor air.",
      icon: <FaWindowClose className="text-purple-500" />,
    },
    {
      min: 301,
      max: 500,
      message: "Hazardous air quality! Stay indoors and use an air purifier.",
      icon: <FaAirFreshener className="text-maroon-500" />,
    },
  ];

  // Find correct recommendation
  const recommendation = recommendations.find((rec) => highestAQI >= rec.min && highestAQI <= rec.max);

  return (

    <div className="bg-white shadow-lg p-6 rounded-lg w-full max-w-2xl">
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
