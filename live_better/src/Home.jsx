import React, { useState } from "react";
import CitySearch from "./components/CitySearch";

const Home = () => {
    return (
        <div className="w-screen text-black min-h-screen flex flex-col items-center justify-center bg-white px-6 md:px-12">

          <CitySearch />

        </div>
      );
      
    };

export default Home;
