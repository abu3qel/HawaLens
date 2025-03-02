import React from "react";
import openweatherlogo from "../assets/openweather.png";
import openaq from "../assets/openaq.png";

const Footer = () => {
  return (
    <footer className="bg-white shadow-md w-full border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center">
        
        {/* Partner Logos */}
        <div className="flex items-center space-x-6">
          <img src={openweatherlogo} alt="OpenWeather Logo" className="h-12" />
          <img src={openaq} alt="OpenAQ Logo" className="h-12" />
        </div>

        {/* Location Information */}
        <div className="flex flex-col md:flex-row items-center space-x-3 text-gray-600 text-sm mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <img src="https://flagcdn.com/w40/gb.png" alt="UK Flag" className="h-5 w-6" />
            <span>United Kingdom</span>
          </div>
          <span className="hidden md:inline">|</span>
          <span className="flex items-center">⚙ AQI* US, Metric</span>
        </div>

        {/* Copyright Information */}
        <div className="text-gray-600 text-sm mt-4 md:mt-0">
          <span>© 2025 IQAir. All rights reserved</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
