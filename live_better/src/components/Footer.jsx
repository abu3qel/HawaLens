import React from "react";
import { CodeBracketIcon } from "@heroicons/react/24/outline"; // GitHub alternative icon
import openweatherlogo from "../assets/open-weather.png";
import openaq from "../assets/openaq.png";

const Footer = () => {
  return (
    <footer className="bg-white shadow-md w-full border-t border-gray-200">


      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center">
        
        <div className="flex items-center space-x-26">
          <img
            src={openweatherlogo}
            alt="Membership Logo"
            className="h-12"
          />
            <img
            src={openaq}
            alt="Membership Logo"
            className="h-12"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center space-x-3 text-gray-600 text-sm mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <img
              src="https://flagcdn.com/w40/gb.png"
              alt="UK Flag"
              className="h-5 w-6"
            />
            <span>United Kingdom</span>
          </div>
          <span className="hidden md:inline">|</span>
          <span className="flex items-center">
            ⚙ AQI* US, Metric
          </span>
        </div>

        <div className="flex flex-col md:items-end text-gray-600 text-sm mt-4 md:mt-0">
          
          <div className="flex space-x-4">
            <a href="https://github.com/your-repository" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800">
              <CodeBracketIcon className="h-6 w-6" />
            </a>
          </div>

          <div className="flex space-x-4 mt-2">
            <a href="#" className="hover:text-blue-500">Terms of Use</a>
            <a href="#" className="hover:text-blue-500">Privacy Policy</a>
            <span>© 2025 Hawa. All rights reserved</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
