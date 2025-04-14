import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  const [trackedLocations, setTrackedLocations] = useState([]);

  const TrackedLocations = ({ locations, onRemove, onRefresh }) => (
    <div className="mt-8 bg-gray-50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Tracked Locations</h3>
        <button 
          onClick={onRefresh}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Refresh Now
        </button>
      </div>
      {locations.length === 0 ? (
        <p className="text-gray-700">No locations being tracked. Click "Add to Tracked Locations" on any station.</p>
      ) : (
        <div className="space-y-4">
          {locations.map((location, index) => (
            <div key={index} className="p-4 bg-white rounded shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-black">{location.name}</h4>
                  <p className="text-sm text-gray-600">
                    {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
                  </p>
                  <div className="flex items-center mt-2">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: getAQIColor(location.aqi) }}
                    ></span>
                    <span className="text-sm text-black">
                      AQI: {location.aqi} ({getAQIDescription(location.aqi)})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {new Date(location.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                  <Link
                    to={`/location/${location.coords.lat}/${location.coords.lng}?name=${encodeURIComponent(location.name)}`}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
        return [...prev, {
          name: station.name,
          coords: station.coords,
          aqi: aqiValue,
          lastUpdated: new Date().toISOString(),
          country: station.country
        }];
      });
    } catch (err) {
      console.error('Error adding to tracked locations:', err);
    }
  };

  const removeTrackedLocation = (index) => {
    setTrackedLocations(prev => prev.filter((_, i) => i !== index));
  };

  const refreshTrackedLocations = async () => {
    setIsLoading(true);
    try {
      const updatedLocations = await Promise.all(
        trackedLocations.map(async (location) => {
          try {
            const aqiData = await fetchCurrentAQI(location.coords.lat, location.coords.lng);
            const newAqi = aqiData?.list?.[0]?.main?.aqi || location.aqi;
            return {
              ...location,
              aqi: newAqi,
              lastUpdated: new Date().toISOString()
            };
          } catch {
            return location;
          }
        })
      );
      setTrackedLocations(updatedLocations);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const defaultPosition = [51.5074, -0.1278]; // London
    leafletMapRef.current = L.map(mapRef.current).setView(defaultPosition, 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMapRef.current);

    markerClusterRef.current = L.markerClusterGroup();
    leafletMapRef.current.addLayer(markerClusterRef.current);

    leafletMapRef.current.on('click', handleMapClick);
    L.control.scale().addTo(leafletMapRef.current);

    loadStationsForLocation(defaultPosition[1], defaultPosition[0], radius);

    return () => {
      if (leafletMapRef.current) leafletMapRef.current.remove();
    };
  }, []);

  useEffect(() => {
    if (leafletMapRef.current) {
      const center = leafletMapRef.current.getCenter();
      loadStationsForLocation(center.lng, center.lat, radius);
    }
  }, [radius]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    loadStationsForLocation(lng, lat, radius);
  };

  const handleSearch = async (e, cityOverride = null) => {
    if (e) e.preventDefault();
    const query = cityOverride || searchQuery;
    if (!query.trim()) return setError('Please enter a location name');
    setIsLoading(true);
    try {
      const results = await searchOpenAQLocations({ locationName: query, radius });
      if (!results || results.length === 0) return setError('No stations found');
      const { coordinates } = results[0];
      if (!coordinates) return setError('Location has no coordinates');
      leafletMapRef.current.setView([coordinates.latitude, coordinates.longitude], 10);
      loadStationsForLocation(coordinates.longitude, coordinates.latitude, radius);
    } catch {
      setError('Error during search');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySelect = (cityName) => {
    setSearchQuery(cityName);
    handleSearch(null, cityName);
  };

  const createColoredMarkerIcon = (aqi) => {
    const color = getAQIColor(aqi);
    return L.divIcon({
      html: `<div class="w-3 h-3 rounded-full border-2 border-white" style="background-color: ${color}"></div>`,
      className: '',
      iconSize: [15, 15],
      iconAnchor: [7, 7]
    });
  };

  const createPollutantList = (components) => {
    const pollutants = {
      co: 'Carbon Monoxide',
      no: 'Nitric Oxide',
      no2: 'Nitrogen Dioxide',
      o3: 'Ozone',
      so2: 'Sulfur Dioxide',
      pm2_5: 'PM2.5',
      pm10: 'PM10',
      nh3: 'Ammonia'
    };
    return `<ul class="m-1 pl-5 text-sm">${Object.entries(components).map(([k, v]) =>
      pollutants[k] ? `<li class="my-1">${pollutants[k]}: ${v.toFixed(2)}</li>` : ''
    ).join('')}</ul>`;
  };

  const loadStationsForLocation = async (lon, lat, radius) => {
    setIsLoading(true);
    setError(null);
    try {
      markerClusterRef.current.clearLayers();
      const stations = await fetchOpenAQStations(lon, lat, radius);
      setStationCount(stations.length);

      stations.forEach(station => {
        const coords = station.coordinates;
        if (!coords?.latitude || !coords?.longitude) return;
        const marker = L.marker([coords.latitude, coords.longitude], {
          icon: createColoredMarkerIcon(1),
          aqi: 1
        });
        marker.on('click', async () => {
          const aqiData = await fetchCurrentAQI(coords.latitude, coords.longitude);
          const aqiInfo = aqiData?.list?.[0];
          const aqiValue = aqiInfo?.main?.aqi || 1;
          const color = getAQIColor(aqiValue);
          const description = getAQIDescription(aqiValue);

          marker.setPopupContent(`
            <div class="p-2">
              <h3 class="text-lg font-bold">${station.name}</h3>
              <p>AQI: <span style="color: ${color}">${aqiValue} (${description})</span></p>
              ${aqiInfo?.components ? createPollutantList(aqiInfo.components) : ''}
              <button class="text-green-600 underline mt-2" onclick="window.trackLocation(${coords.latitude}, ${coords.longitude}, '${station.name}', '${station.country || ''}')">+ Track location</button>
            </div>
          `);
          marker.setIcon(createColoredMarkerIcon(aqiValue));
          marker.options.aqi = aqiValue;
        });
        marker.bindPopup(`<p>Click for AQI data</p>`);
        markerClusterRef.current.addLayer(marker);
      });
    } catch (err) {
      setError('Failed to load stations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="max-w-7xl mx-auto w-full pb-4">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Air Quality Index Map</h2>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-4">
            <CitySearch onSelectCity={handleCitySelect} className="text-black" />
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-4 py-2 border rounded-md text-black"
            >
              <option value="1000">1 km</option>
              <option value="5000">5 km</option>
              <option value="10000">10 km</option>
              <option value="25000">25 km</option>
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <div ref={mapRef} className="h-[32rem] w-full rounded-lg shadow-sm border" />
          <TrackedLocations
            locations={trackedLocations}
            onRemove={removeTrackedLocation}
            onRefresh={refreshTrackedLocations}
          />
        </div>
      </div>
    </div>
  );
};

export default AQIMapComponent;
