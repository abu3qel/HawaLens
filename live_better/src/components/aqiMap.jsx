import React, { useEffect, useState, useRef, useContext } from 'react';
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
import { useEvents } from '../context/EventContext';
import CitySearch from '../components/CitySearch';
import { AuthContext } from './AuthContext';
import PreferencesModal from './PreferencesModal';

const AQIMapComponent = () => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerClusterRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stationCount, setStationCount] = useState(0);
  const [trackedLocations, setTrackedLocations] = useState([]);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const refreshTimerRef = useRef(null);
  const { triggerEmailAlert} = useEvents();
  const { 
    currentUser, 
    userPreferences, 
    emailPreferences,
  } = useContext(AuthContext);

  // Tracked Locations Component
  const TrackedLocations = ({ locations, onRemove, onRefresh }) => {
    return (
      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-100 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Tracked Locations
          </h3>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPrefsModal(true)}
              className="px-4 py-2 bg-gray-100 text-white rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Now
            </button>
          </div>
        </div>
        
        {locations.length === 0 ? (
          <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-100">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-700">No locations being tracked.</p>
            <p className="text-gray-500 text-sm mt-2">Click "Add to Tracked Locations" on any station.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {locations.map((location, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span
                        className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: getAQIColor(location.aqi) }}
                      ></span>
                      <h4 className="font-medium text-gray-800 truncate">{location.name}</h4>
                    </div>
                    
                    <p className="text-sm text-gray-500 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
                    </p>
                    
                    <div className="flex items-center">
                      <div className="flex items-center bg-gray-50 px-2 py-1 rounded text-sm">
                        <span className="text-gray-700">
                          AQI: <span className="font-medium">{location.aqi}</span> 
                          <span className="text-gray-500 ml-1">({getAQIDescription(location.aqi)})</span>
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Last updated: {new Date(location.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 space-x-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                  
                  <Link
                    to={`/location/${location.coords.lat}/${location.coords.lng}?name=${encodeURIComponent(location.name)}`}
                    className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Add location to tracking
  const addToTrackedLocations = async (station) => {
    try {
      const aqiData = await fetchCurrentAQI(station.coords.lat, station.coords.lng);
      const aqiValue = aqiData?.list?.[0]?.main?.aqi || 1;
      
      setTrackedLocations(prev => {
        const exists = prev.some(loc => 
          loc.name === station.name && 
          loc.coords.lat === station.coords.lat && 
          loc.coords.lng === station.coords.lng
        );
        
        if (exists) return prev;
        
        return [
          ...prev,
          {
            name: station.name,
            coords: station.coords,
            aqi: aqiValue,
            lastUpdated: new Date().toISOString(),
            country: station.country
          }
        ];
      });
    } catch (err) {
      console.error('Error adding to tracked locations:', err);
    }
  };

  // Remove location from tracking
  const removeTrackedLocation = (index) => {
    setTrackedLocations(prev => prev.filter((_, i) => i !== index));
  };

  // Refresh all tracked locations
  const refreshTrackedLocations = async () => {
    setIsLoading(true);
    try {
      console.log("Refreshing tracked locations...");
      const updatedLocations = await Promise.all(
        trackedLocations.map(async (location) => {
          try {
            const aqiData = await fetchCurrentAQI(location.coords.lat, location.coords.lng);
            const newAqi = aqiData?.list?.[0]?.main?.aqi || location.aqi;
      
            console.log('[DEBUG] Refreshing:', location.name);
            console.log('[DEBUG] AQI Value:', newAqi);
            console.log('[DEBUG] currentUser:', currentUser);
            console.log('[DEBUG] emailPreferences:', emailPreferences);
            console.log('[DEBUG] userPreferences:', userPreferences);
      
            if (emailPreferences.aqiAlerts && currentUser?.email && newAqi >= userPreferences.aqiAlertThreshold) {
              console.log('[DEBUG] All conditions passed, sending email alert...');
              await triggerEmailAlert({
                name: location.name,
                coords: location.coords
              }, newAqi);
            } else {
              console.log('[DEBUG] Skipping email alert: condition not met');
            }
      
            return {
              ...location,
              aqi: newAqi,
              lastUpdated: new Date().toISOString()
            };
          } catch (err) {
            console.error(`Error refreshing ${location.name}:`, err);
            return location;
          }
        })
      );
      
      setTrackedLocations(updatedLocations);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up refresh interval based on user preferences
  useEffect(() => {
    if (trackedLocations.length === 0) return;

    const refreshData = () => refreshTrackedLocations();
    const interval = userPreferences.refreshInterval;

    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(refreshData, interval);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [trackedLocations, userPreferences.refreshInterval]);

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
            
            setTimeout(() => {
              const trackButton = document.getElementById(`track-location-${coords.latitude}-${coords.longitude}`);
              if (trackButton) {
                trackButton.addEventListener('click', (e) => {
                  e.stopPropagation();
                  addToTrackedLocations({
                    name: station.name,
                    coords: {
                      lat: coords.latitude,
                      lng: coords.longitude
                    },
                    country: station.country
                  });
                  trackButton.textContent = '✓ Location tracked';
                  trackButton.disabled = true;
                  trackButton.className = 'text-sm text-gray-500 hover:text-gray-700 hover:underline';
                });
              }
            }, 100);
                            
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

  useEffect(() => {
    const mapElement = document.querySelector('.leaflet-container');
    if (mapElement) {
      mapElement.style.zIndex = showPrefsModal ? '0' : '1';
    }
  }, [showPrefsModal]);
  

  return (
    <div className="min-h-screen w-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Air Quality Index Map
            </h2>
            
            <div className="mb-8">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-grow">
                  <CitySearch onSelectCity={handleCitySelect} className="w-full text-gray-800" />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <select 
                    value={radius} 
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 transition-all duration-200"
                  >
                    <option value="1000">1 km</option>
                    <option value="5000">5 km</option>
                    <option value="10000">10 km</option>
                    <option value="25000">25 km (max)</option>
                  </select>
                  
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200 shadow-sm flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              {error && (
                <div className="p-4 mb-6 text-red-700 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              
              <div className="flex items-center text-gray-700 mb-4">
                {stationCount > 0 ? (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Found <strong>{stationCount}</strong> air quality monitoring stations</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>No stations found in this area</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  AQI Legend
                </h4>
                <div className="space-y-3">
                  {[
                    { level: 1, label: "Good" },
                    { level: 2, label: "Fair" },
                    { level: 3, label: "Moderate" },
                    { level: 4, label: "Poor" },
                    { level: 5, label: "Very Poor" }
                  ].map(({ level, label }) => (
                    <div key={level} className="flex items-center bg-white p-2 rounded-md shadow-sm">
                      <span 
                        className="w-6 h-6 mr-3 rounded-full border border-white shadow-sm flex-shrink-0" 
                        style={{ backgroundColor: getAQIColor(level) }}
                      ></span>
                      <div>
                        <div className="font-medium text-gray-800">{level}: {label}</div>
                        <div className="text-xs text-gray-500">{getAQIDescription(level)}</div>
                      </div>
                    </div>     
                  ))}
                </div>
              </div>
              
              <div className="lg:col-span-4">
                <div 
                  ref={mapRef} 
                  className="h-96 md:h-[32rem] w-full rounded-lg shadow-md border border-gray-200 overflow-hidden"
                ></div>
              </div>
            </div>

            <TrackedLocations
              locations={trackedLocations}
              onRemove={removeTrackedLocation}
              onRefresh={refreshTrackedLocations}
              getAQIColor={getAQIColor}
              getAQIDescription={getAQIDescription}
              setShowPrefsModal={setShowPrefsModal}
            />
            
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 space-y-1 mb-4 sm:mb-0">
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Click anywhere on the map to search for air quality stations near that location.
                </p>
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Data provided by OpenAQ API. Air quality index follows the EU standard.
                </p>
              </div>
              

            </div>
          </div>
        </div>
      </div>
      {showPrefsModal && <PreferencesModal onClose={() => setShowPrefsModal(false)} />}
    </div>
  );
};

export default AQIMapComponent;
