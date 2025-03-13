import React, { useState } from "react";
import CitySearch from "./components/CitySearch";
import AQICard from "./components/AQICard";
import AQIRecommendations from "./components/aqiRecommendations";
import HourlyForecast from "./components/hourlyForecast";
import AQIHistoryChart from "./components/aqiHistoryChart";
import { getCoordinatesByCity } from "./api/geocodingUtils";
import { getAQIDataForCity } from "./utils/apiHandler";

const Home = () => {

    const [selectedCity, setSelectedCity] = useState(null);
    const [loading, setLoading] = useState(null);
    const [coordinates, setCoordinates] = useState(null);
    const [aqiData, setAQIData] = useState(null);

    const handleCitySelect = async (cityName) => {
        setLoading(true);
        setSelectedCity(cityName);

        const data = await getAQIDataForCity(cityName);
        if (data){
          setAQIData(data.currentAQI);
        }

        // Fetch and set coordinates
        const locationData = await getCoordinatesByCity(cityName);
        if (locationData) {
          setCoordinates({ lat: locationData.lat, lon: locationData.lon });
        }
    
        setLoading(false);
      };
    
    return (
        <div className="w-screen text-black min-h-screen flex flex-col items-center justify-center bg-white px-6 md:px-12">
          <CitySearch onSelectCity = {handleCitySelect}/>
          <AQICard data={aqiData} className="w-full"/>
          <AQIRecommendations data={aqiData} className="w-full"/>
          <AQIHistoryChart selectedCity={selectedCity} selectedCoordinates={coordinates} className="w-full"/>
          <HourlyForecast selectedCity={selectedCity} selectedCoordinates={coordinates} className="w-full" />
        </div>
      );
      
    };

export default Home;
