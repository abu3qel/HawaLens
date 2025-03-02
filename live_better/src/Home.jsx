import React, { useState } from "react";
import CitySearch from "./components/CitySearch";

import { getCoordinatesByCity } from "./api/geocodingUtils";

const Home = () => {

    const [selectedCity, setSelectedCity] = useState(null);
    const [loading, setLoading] = useState(null);
    const [coordinates, setCoordinates] = useState(null);

    

    const handleCitySelect = async (cityName) => {
        setLoading(true);
        setSelectedCity(cityName);

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

        </div>
      );
      
    };

export default Home;
