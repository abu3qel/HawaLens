import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Settings, MoreHorizontal, Info } from "lucide-react";
import CitySearch from "../components/CitySearch";
import AQICard from "../components/aqiCard";
import ForecastComponent from "../components/forecastComponent";
import AQIRecommendations from "../components/aqiRecommendations";
import HourlyForecast from "../components/hourlyForecast";
import AQIHistoryChart from "../components/aqiHistoryChart";
import PredictAQI from "../components/predictAQI";
import { getAQIDataForCity } from "../utils/apiHandler";
import { getCoordinatesByCity, getCityByCoordinates } from "../api/geocodingUtils";
import  jsPDF  from "jspdf";
import autoTable from "jspdf-autotable";

const LocationDetailPage = () => {
  const { lat, lon } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState({
    name: queryParams.get('name') || '',
    country: queryParams.get('country') || '',
    coordinates: lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!locationInfo.coordinates) return;
      
      setLoading(true);
      
      try {
        // If we don't have a name, try to get it from coordinates
        if (!locationInfo.name) {
          const cityData = await getCityByCoordinates(locationInfo.coordinates.lat, locationInfo.coordinates.lon);
          if (cityData) {
            setLocationInfo(prev => ({
              ...prev,
              name: cityData.name,
              country: cityData.country || prev.country
            }));
          }
        }
        
        // Get AQI data
        const fullData = await getAQIDataForCity(`${locationInfo.coordinates.lat},${locationInfo.coordinates.lon}`);
        if (fullData && fullData.currentAQI) {
          setAqiData({
            ...fullData.currentAQI,
            list: fullData.currentAQI.list || [{
              main: { aqi: fullData.currentAQI.aqi },
              components: fullData.currentAQI.components
            }]
          });
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationInfo.coordinates]);

  const exportToCSV = () => {
    if (!aqiData) return;

    const headers = ["Parameter", "Value", "Unit"];
    const data = Object.entries(aqiData.components || {}).map(([key, value]) => [
      key.toUpperCase(),
      value,
      "µg/m³" // Most air quality measurements are in µg/m³
    ]);

    // Add AQI information
    data.unshift(["AQI Index", aqiData.list[0].main.aqi, ""]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + data.map(row => row.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aqi_report_${locationInfo.name || 'location'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!aqiData) return;
  
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    // Title
    doc.setFontSize(18);
    doc.text(`Air Quality Report - ${locationInfo.name || 'Location'}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${date}`, 14, 30);
    
    if (locationInfo.coordinates) {
      doc.text(`Coordinates: ${locationInfo.coordinates.lat.toFixed(4)}, ${locationInfo.coordinates.lon.toFixed(4)}`, 14, 40);
    }
  
    // AQI Summary
    doc.setFontSize(14);
    doc.text("Current AQI Summary", 14, 55);
    
    const aqiSummary = [
      ["AQI Index", aqiData.list[0].main.aqi],
      ["Main Pollutant", aqiData.list[0].main.pm2_5 ? "PM2.5" : Object.keys(aqiData.components)[0]]
    ];
    
    // Store the result of first autoTable call
    const firstTableResult = autoTable(doc, {
      startY: 60,
      head: [["Metric", "Value"]],
      body: aqiSummary,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] }
    });
  
    // Use the finalY property from the first table result
    const firstTableEndY = doc.lastAutoTable.finalY || 70; // Fallback if something goes wrong
  
    // Pollutant Details
    doc.setFontSize(14);
    doc.text("Pollutant Details (µg/m³)", 14, firstTableEndY + 20);
    
    const pollutantData = Object.entries(aqiData.components || {}).map(([key, value]) => [
      key.toUpperCase(),
      value
    ]);
    
    autoTable(doc, {
      startY: firstTableEndY + 25,
      head: [["Pollutant", "Concentration"]],
      body: pollutantData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] }
    });
  
    // Save the PDF
    doc.save(`aqi_report_${locationInfo.name || 'location'}.pdf`);
  };

  const handleCitySelect = async (cityName) => {
    setLoading(true);
    setLocationInfo(prev => ({ ...prev, name: cityName }));
    
    try {
      const fullData = await getAQIDataForCity(cityName);
      if (fullData && fullData.currentAQI) {
        setAqiData({
          ...fullData.currentAQI,
          list: fullData.currentAQI.list || [{
            main: { aqi: fullData.currentAQI.aqi },
            components: fullData.currentAQI.components
          }]
        });
      }

      // Fetch and set coordinates
      const locationData = await getCoordinatesByCity(cityName);
      if (locationData) {
        setLocationInfo(prev => ({
          ...prev,
          coordinates: { lat: locationData.lat, lon: locationData.lon },
          country: locationData.country || prev.country
        }));
      }
    } catch (error) {
      console.error("Error fetching city data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAQILevelColor = (aqi) => {
    if (!aqi) return "bg-gray-200";
    if (aqi <= 50) return "bg-green-500"; // Good
    if (aqi <= 100) return "bg-yellow-400"; // Moderate
    if (aqi <= 150) return "bg-orange-500"; // Unhealthy for Sensitive Groups
    if (aqi <= 200) return "bg-red-500"; // Unhealthy
    if (aqi <= 300) return "bg-purple-600"; // Very Unhealthy
    return "bg-rose-800"; // Hazardous
  };

  const getAQILevelText = (aqi) => {
    if (!aqi) return "Unknown";
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-white">
      {/* Header similar to IQAir */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="w-5 h-5 mr-2 text-blue-600" />
              <span className="text-blue-600 font-medium">Back</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
          {aqiData && (
            <div className="relative mt-4">
              <button
                onClick={() => document.getElementById('export-dropdown').classList.toggle('hidden')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <div id="export-dropdown" className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={exportToCSV}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-100"
                    role="menuitem"
                  >
                    Export to CSV
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-100"
                    role="menuitem"
                  >
                    Export to PDF
                  </button>
                </div>
              </div>
            </div>
          )}
            {/* <button className="p-2 rounded-full hover:bg-gray-100">
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button> */}
          </div>
        </div>
      </header>

      {/* Search bar similar to IQAir
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative rounded-full border border-gray-300 flex items-center">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 rounded-full bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Your country, city or location..."
              onChange={(e) => { if (e.target.value) handleCitySelect(e.target.value) }}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Info className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div> */}

      {/* Location breadcrumb */}
      {locationInfo.name && (
        <div className="bg-yellow-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center text-sm text-gray-600">
              <span>World</span>
              <span className="mx-1">/</span>
              <span>{locationInfo.country || 'Country'}</span>
              <span className="mx-1">/</span>
              <span>Region</span>
              <span className="mx-1">/</span>
              <span className="font-medium">{locationInfo.name}</span>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div>
              {/* Main title and location info */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Air quality near {locationInfo.name || 'this location'}
                  {locationInfo.country && (
                    <span className="text-xl font-normal ml-2 text-gray-600">
                      {locationInfo.country}
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  Air Quality Index (AQI) and air pollution (PM2.5) near {locationInfo.name}
                </p>
                {locationInfo.coordinates && (
                  <p className="text-gray-500 mt-1 text-sm">
                    {locationInfo.coordinates.lat.toFixed(4)}, {locationInfo.coordinates.lon.toFixed(4)} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                )}

     
              </div>

              {/* Current AQI Box */}
              

              {/* Hourly forecast section */}
              <div className="mb-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-lg text-gray-900">Hourly forecast</h2>
                    <p className="text-sm text-gray-600">Air Quality Index (AQI) forecast at {locationInfo.name}</p>
                  </div>
                  <div className="p-4">
                    <HourlyForecast 
                      selectedCity={locationInfo.name} 
                      selectedCoordinates={locationInfo.coordinates} 
                    />
                  </div>
                </div>
              </div>

              {/* Grid layout for AQI components and forecast */}
              <div className="grid grid-cols-1 md:ex-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-lg text-gray-900">Daily forecast</h2>
                  </div>
                  <div className="p-4">
                    <ForecastComponent
                      selectedCity={locationInfo.name} 
                      selectedCoordinates={locationInfo.coordinates}  
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-lg text-gray-900">Air pollutants</h2>
                    <p className="text-sm text-gray-600">What is the air quality near {locationInfo.name}?</p>
                  </div>
                  <div className="p-4">
                    {aqiData && <AQICard data={aqiData} />}
                  </div>
                </div>
              </div>

              {/* AQI Recommendations and Predictions */}
              <div className="grid grid-cols-1 gap-8 mb-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-lg text-gray-900">Health recommendations</h2>
                  </div>
                  <div className="p-4">
                    {aqiData && <AQIRecommendations data={aqiData} />}
                  </div>
                </div>
                
                {/* <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-lg text-gray-900">Air quality forecast</h2>
                  </div>
                  <div className="p-4">
                    <PredictAQI
                      selectedCity={locationInfo.name} 
                      selectedCoordinates={locationInfo.coordinates}  
                    />
                  </div>
                </div> */}
              </div>

              {/* AQI History Chart */}
              <div className="mb-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-lg text-gray-900">Air quality history</h2>
                    <p className="text-sm text-gray-600">Air data evolution at {locationInfo.name}</p>
                  </div>
                  <div className="p-4">
                    {locationInfo.coordinates && (
                      <AQIHistoryChart 
                        selectedCity={locationInfo.name} 
                        selectedCoordinates={locationInfo.coordinates} 
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


    </div>
  );
};

export default LocationDetailPage;