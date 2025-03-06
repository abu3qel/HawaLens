import React from "react";

// Simple AQI Calculation
const calculateAQI = (Cp, BPLo, BPHi, ILo, IHi) => {
  return Math.round(((IHi - ILo) / (BPHi - BPLo)) * (Cp - BPLo) + ILo);
};

// Basic AQI Breakpoints (Only PM2.5 and PM10)
const AQI_BREAKPOINTS = {
  pm2_5: [
    { BPLo: 0, BPHi: 12, ILo: 0, IHi: 50 },
    { BPLo: 12.1, BPHi: 35.4, ILo: 51, IHi: 100 },
  ],
  pm10: [
    { BPLo: 0, BPHi: 54, ILo: 0, IHi: 50 },
    { BPLo: 55, BPHi: 154, ILo: 51, IHi: 100 },
  ],
};

// Function to get AQI for a pollutant
const getAQI = (pollutant, value) => {
  const breakpoints = AQI_BREAKPOINTS[pollutant];
  if (!breakpoints) return null;

  for (let bp of breakpoints) {
    if (value >= bp.BPLo && value <= bp.BPHi) {
      return calculateAQI(value, bp.BPLo, bp.BPHi, bp.ILo, bp.IHi);
    }
  }
  return null;
};

const AQIRecommendations = ({ data }) => {
  if (!data) return <p>No AQI data available</p>;

  const { pm2_5, pm10 } = data.list[0].components;
  const aqiPm25 = getAQI("pm2_5", pm2_5);
  const aqiPm10 = getAQI("pm10", pm10);
  const highestAQI = Math.max(aqiPm25 || 0, aqiPm10 || 0);

  // Basic Recommendations
  let recommendation = "Air quality is good. Enjoy outdoor activities!";
  if (highestAQI > 50) {
    recommendation = "Air quality is moderate. Sensitive groups should reduce outdoor activities.";
  }
  if (highestAQI > 100) {
    recommendation = "Unhealthy for sensitive groups. Consider wearing a mask.";
  }

  return (
    <div className="bg-white shadow p-4 rounded">
      <h2 className="text-lg font-bold">Health Recommendations</h2>
      <p>{recommendation}</p>
    </div>
  );
};

export default AQIRecommendations;
