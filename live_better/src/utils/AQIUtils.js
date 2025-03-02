import React from "react";

// AQI Calculation Function
const calculateAQI = (Cp, breakpoints) => {
  const { BPLo, BPHi, ILo, IHi } = breakpoints;
  return Math.round(((IHi - ILo) / (BPHi - BPLo)) * (Cp - BPLo) + ILo);
};

const AQI_BREAKPOINTS = {
  so2: [
    { BPLo: 0, BPHi: 20, ILo: 0, IHi: 50 },
    { BPLo: 20, BPHi: 80, ILo: 51, IHi: 100 },
    { BPLo: 80, BPHi: 250, ILo: 101, IHi: 150 },
    { BPLo: 250, BPHi: 350, ILo: 151, IHi: 200 },
    { BPLo: 350, BPHi: Infinity, ILo: 201, IHi: 300 },
  ],
  no2: [
    { BPLo: 0, BPHi: 40, ILo: 0, IHi: 50 },
    { BPLo: 40, BPHi: 70, ILo: 51, IHi: 100 },
    { BPLo: 70, BPHi: 150, ILo: 101, IHi: 150 },
    { BPLo: 150, BPHi: 200, ILo: 151, IHi: 200 },
    { BPLo: 200, BPHi: Infinity, ILo: 201, IHi: 300 },
  ],
};

// Find the correct breakpoint range
const getAQI = (pollutant, value) => {
  const breakpoints = AQI_BREAKPOINTS[pollutant];

  if (!breakpoints) return null; // Return null if pollutant is not found

  for (let i = 0; i < breakpoints.length; i++) {
    const { BPLo, BPHi } = breakpoints[i];

    if (value >= BPLo && value <= BPHi) {
      return calculateAQI(value, breakpoints[i]);
    }
  }

  return null;
};

export { getAQI, AQI_BREAKPOINTS };
