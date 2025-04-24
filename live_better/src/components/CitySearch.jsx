import React, { useState } from "react";
import { getCitySuggestions } from "../api/geocodingUtils";

const CitySearch = ({ onSelectCity }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleSearch = async (e) => {
    const input = e.target.value;
    setQuery(input);

    if (input.length > 2) {
      const results = await getCitySuggestions(input);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (city) => {
    onSelectCity(city.name);
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Search for a city..."
        value={query}
        onChange={handleSearch}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
      />
      {suggestions.length > 0 && (
        <ul className="absolute bg-white border border-gray-300 w-full mt-1 rounded-md shadow-md z-50 text-black">
          {suggestions.map((city, index) => (
            <li
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(city)}
            >
              {city.name}, {city.country}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CitySearch;
