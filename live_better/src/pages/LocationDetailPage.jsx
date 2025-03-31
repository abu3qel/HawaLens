import React, { useState, useEffect } from "react";
import { useParams, useLocation } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";
import CitySearch from "../components/CitySearch";
import AQICard from "../components/aqiCard";
import ForecastComponent from "../components/forecastComponent";
import AQIRecommendations from "../components/aqiRecommendations";
import HourlyForecast from "../components/hourlyForecast";
import AQIHistoryChart from "../components/aqiHistoryChart";
import PredictAQI from "../components/predictAQI";
import { getAQIDataForCity } from "../utils/apiHandler";
import { getCoordinatesByCity, getCityByCoordinates } from "../api/geocodingUtils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

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
    
    doc.autoTable({
      startY: 60,
      head: [["Metric", "Value"]],
      body: aqiSummary,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Pollutant Details
    doc.setFontSize(14);
    doc.text("Pollutant Details (µg/m³)", 14, doc.autoTable.previous.finalY + 20);
    
    const pollutantData = Object.entries(aqiData.components || {}).map(([key, value]) => [
      key.toUpperCase(),
      value
    ]);
    
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 25,
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading data...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-8">
                <div className="mb-8">
                  {/* <CitySearch onSelectCity={handleCitySelect} /> */}
                  <h1 className="text-3xl font-bold text-gray-900 mt-4">
                    {locationInfo.name ? `Air Quality for ${locationInfo.name}` : 'Location Details'}
                    {locationInfo.country && (
                      <span className="text-xl font-normal ml-2 text-gray-600">
                        ({locationInfo.country})
                      </span>
                    )}
                  </h1>
                  {locationInfo.coordinates && (
                    <p className="text-gray-500 mt-2">
                      Coordinates: {locationInfo.coordinates.lat.toFixed(4)}, {locationInfo.coordinates.lon.toFixed(4)}
                    </p>
                  )}

{aqiData && (
                      <div className="flex space-x-2">
                        <button
                          onClick={exportToCSV}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={exportToPDF}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Export PDF
                        </button>
                      </div>
                    )}
                </div>

                <div className="space-y-10">
                  <HourlyForecast 
                    selectedCity={locationInfo.name} 
                    selectedCoordinates={locationInfo.coordinates} 
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ForecastComponent
                      selectedCity={locationInfo.name} 
                      selectedCoordinates={locationInfo.coordinates}  
                    />
                    {aqiData && <AQICard data={aqiData} />}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {aqiData && <AQIRecommendations data={aqiData} />}
                    <PredictAQI
                      selectedCity={locationInfo.name} 
                      selectedCoordinates={locationInfo.coordinates}  
                    />
                  </div>

                  {locationInfo.coordinates && (
                    <AQIHistoryChart 
                      selectedCity={locationInfo.name} 
                      selectedCoordinates={locationInfo.coordinates} 
                    />
                  )}
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