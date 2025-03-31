import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { 
  fetchOpenAQStations, 
  searchOpenAQLocations, 
  fetchCurrentAQI, 
  getAQIDescription,
  getAQIColor
} from '../utils/openaqService';
import CitySearch from '../components/CitySearch';

const AQIMapComponent = () => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerClusterRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stationCount, setStationCount] = useState(0);

  // Initialize map
  useEffect(() => {
    if (!leafletMapRef.current) {
      const defaultPosition = [51.5074, -0.1278];
      
      leafletMapRef.current = L.map(mapRef.current).setView(defaultPosition, 10);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMapRef.current);
      
      markerClusterRef.current = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 80,
        iconCreateFunction: function(cluster) {
          const childMarkers = cluster.getAllChildMarkers();
          let totalAqi = 0;
          let count = 0;
          
          childMarkers.forEach(marker => {
            if (marker.options.aqi) {
              totalAqi += marker.options.aqi;
              count++;
            }
          });
          
          const avgAqi = count > 0 ? Math.round(totalAqi / count) : 1;
          const color = getAQIColor(avgAqi);
          
          return L.divIcon({
            html: `
              <div class="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white" 
                   style="background-color: ${color}">
                <span class="text-white font-bold text-sm">${cluster.getChildCount()}</span>
              </div>
            `,
            className: '',
            iconSize: L.point(40, 40, true)
          });
        }
      });
      
      leafletMapRef.current.addLayer(markerClusterRef.current);
      L.control.scale().addTo(leafletMapRef.current);
      loadStationsForLocation(defaultPosition[1], defaultPosition[0], radius);
    }
    
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Handle radius changes
  useEffect(() => {
    if (leafletMapRef.current) {
      const center = leafletMapRef.current.getCenter();
      loadStationsForLocation(center.lng, center.lat, radius);
    }
  }, [radius]);

  // Create pollutant list
  const createPollutantList = (components) => {
    const pollutants = {
      co: 'Carbon Monoxide (μg/m³)',
      no: 'Nitric Oxide (μg/m³)',
      no2: 'Nitrogen Dioxide (μg/m³)',
      o3: 'Ozone (μg/m³)',
      so2: 'Sulfur Dioxide (μg/m³)',
      pm2_5: 'PM2.5 (μg/m³)',
      pm10: 'PM10 (μg/m³)',
      nh3: 'Ammonia (μg/m³)'
    };
    
    let html = '<ul class="m-1 pl-5 text-sm">';
    
    for (const [key, value] of Object.entries(components)) {
      if (pollutants[key]) {
        html += `<li class="my-1">${pollutants[key]}: ${value.toFixed(2)}</li>`;
      }
    }
    
    html += '</ul>';
    return html;
  };

  // Create colored marker icon
  const createColoredMarkerIcon = (aqi) => {
    const color = getAQIColor(aqi);
    return L.divIcon({
      html: `<div class="w-3 h-3 rounded-full border-2 border-white" style="background-color: ${color}"></div>`,
      className: '',
      iconSize: [15, 15],
      iconAnchor: [7, 7]
    });
  };

  // Load stations for location
  const loadStationsForLocation = async (lon, lat, radius) => {
    setIsLoading(true);
    setError(null);
      
    try {
      if (markerClusterRef.current) {
        markerClusterRef.current.clearLayers();
      }
        
      const stations = await fetchOpenAQStations(lon, lat, radius);
      setStationCount(stations.length);
        
      if (stations.length === 0) {
        setError('No monitoring stations found in this area. Try increasing the radius or searching in a different location.');
        L.circle([lat, lon], {
          color: 'blue',
          fillColor: '#30f',
          fillOpacity: 0.1,
          radius: Number(radius)
        }).addTo(markerClusterRef.current);
        return;
      }
        
      stations.forEach(station => {
        const coords = station.coordinates;
        if (!coords || !coords.latitude || !coords.longitude) return;
          
        const marker = L.marker([coords.latitude, coords.longitude], {
          aqi: 1,
          icon: createColoredMarkerIcon(1)
        });
          
        marker.on('click', async () => {
          marker.setPopupContent(`
            <div class="p-2">
              <h3 class="text-lg font-bold m-0 p-0">${station.name}</h3>
              <p class="my-1">Loading AQI data...</p>
            </div>
          `);
              
          try {
            const aqiData = await fetchCurrentAQI(coords.latitude, coords.longitude);
                
            if (!aqiData || !aqiData.list || !aqiData.list[0] || !aqiData.list[0].main) {
              marker.setPopupContent(`
                <div class="p-2">
                  <h3 class="text-lg font-bold m-0 p-0">${station.name}</h3>
                  <p class="my-1">AQI data unavailable</p>
                </div>
              `);
              return;
            }
                
            const aqiInfo = aqiData.list[0];
            const aqiValue = aqiInfo.main.aqi;
            const label = getAQIDescription(aqiValue);
            const color = getAQIColor(aqiValue);
                
            marker.setPopupContent(`
              <div class="p-2">
                <h3 class="text-lg font-bold m-0 p-0">${station.name}</h3>
                <p class="my-1">Location: ${station.country || 'Unknown'}</p>
                <p class="my-1">AQI: <span class="font-bold" style="color: ${color}">${aqiValue} (${label})</span></p>
                <p class="my-1 text-xs">Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}</p>
                ${aqiInfo.components ? '<h4 class="my-1 text-sm font-semibold">Pollutant Levels (μg/m³):</h4>' : ''}
                ${aqiInfo.components ? createPollutantList(aqiInfo.components) : ''}
                <div class="flex justify-between mt-3">
                  <a 
                    href="/location/${coords.latitude}/${coords.longitude}?name=${encodeURIComponent(station.name)}&country=${encodeURIComponent(station.country || '')}" 
                    class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    onclick="event.stopPropagation(); window.location.href=this.href"
                  >
                    View details →
                  </a>
                  <button 
                    id="track-location-${coords.latitude}-${coords.longitude}"
                    class="text-sm text-green-600 hover:text-green-800 hover:underline"
                  >
                    + Track location
                  </button>
                </div>
              </div>
            `);
                            
            marker.setIcon(createColoredMarkerIcon(aqiValue));
            marker.options.aqi = aqiValue;
          } catch (err) {
            marker.setPopupContent(`
              <div class="p-2">
                <h3 class="text-lg font-bold m-0 p-0">${station.name}</h3>
                <p class="my-1">Error loading AQI data</p>
              </div>
            `);
            console.error('Error fetching AQI for station:', err);
          }
        });
        
        marker.bindPopup(`
          <div class="p-2">
            <h3 class="text-lg font-bold m-0 p-0">${station.name}</h3>
            <p class="my-1">Click for AQI data</p>
          </div>
        `);
        markerClusterRef.current.addLayer(marker);
      });
        
      L.circle([lat, lon], {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.1,
        radius: Number(radius)
      }).addTo(markerClusterRef.current);
        
    } catch (err) {
      setError('Failed to load stations. Please try again.');
      console.error('Error loading stations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle city selection
  const handleCitySelect = (cityName) => {
    setSearchQuery(cityName);
    handleSearch(null, cityName);
  };

  // Handle search
  const handleSearch = async (e, cityNameOverride = null) => {
    if (e) e.preventDefault();
      
    const queryToUse = cityNameOverride || searchQuery;
      
    if (!queryToUse.trim()) {
      setError('Please enter a location name');
      return;
    }
      
    setIsLoading(true);
    setError(null);
      
    try {
      const results = await searchOpenAQLocations({
        locationName: queryToUse,
        radius: Number(radius)
      });
        
      if (!results || results.length === 0) {
        setError('No stations found for this location. Try adjusting the radius or try a different location.');
        return;
      }
        
      const firstStation = results[0];
      if (firstStation && firstStation.coordinates) {
        leafletMapRef.current.setView(
          [firstStation.coordinates.latitude, firstStation.coordinates.longitude], 
          10
        );
        loadStationsForLocation(
          firstStation.coordinates.longitude,
          firstStation.coordinates.latitude,
          radius
        );
      } else {
        setError('The location was found but has invalid coordinates. Please try another location.');
      }
    } catch (err) {
      setError('Error searching for location. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle map click
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    loadStationsForLocation(lng, lat, radius);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
        <div className="max-w-7xl mx-auto w-full pb-4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Air Quality Index Map</h2>
              
              <div className="mb-8">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-grow">
                    <CitySearch onSelectCity={handleCitySelect} className="text-black" />
                  </div>
                  
                  <select 
                    value={radius} 
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="1000">1 km</option>
                    <option value="5000">5 km</option>
                    <option value="10000">10 km</option>
                    <option value="25000">25 km (max)</option>
                  </select>
                  
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                </form>
                
                {error && (
                  <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                
                <div className="text-gray-700 mb-4">
                  {stationCount > 0 
                    ? `Found ${stationCount} air quality monitoring stations`
                    : 'No stations found in this area'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-lg mb-3">AQI Legend</h4>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} className="flex items-center">
                        <span 
                          className="w-4 h-4 mr-2 rounded-full border border-white" 
                          style={{backgroundColor: getAQIColor(level)}}
                        ></span>
                        <span>{level}: {getAQIDescription(level)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="lg:col-span-4">
                  <div 
                    ref={mapRef} 
                    className="h-96 md:h-[32rem] w-full rounded-lg shadow-sm border border-gray-200"
                  ></div>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-gray-600">
                <p>Click anywhere on the map to search for air quality stations near that location.</p>
                <p className="mt-1">Data provided by OpenAQ API. Air quality index follows the EU standard.</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AQIMapComponent;