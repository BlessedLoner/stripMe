import { useState } from "react";

export default function LocationInput({ onSelect, countryCode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const fetchLocations = async (value) => {
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.locationiq.com/v1/autocomplete?key=${import.meta.env.VITE_LOCATIONIQ_KEY}&q=${value}&limit=5&format=json&countrycodes=${countryCode}`,
      );

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("LocationIQ error:", err);
    }
  };

  const handleSelect = async (place) => {
    setQuery(place.display_name);
    setResults([]);

    try {
      const res = await fetch(
        `https://api.locationiq.com/v1/reverse?key=${import.meta.env.VITE_LOCATIONIQ_KEY}&lat=${place.lat}&lon=${place.lon}&format=json`,
      );

      const data = await res.json();
      const address = data.address || {};

      const cleanLocation = {
        city:
          address.city ||
          address.town ||
          address.village ||
          address.hamlet ||
          "",

        state: address.state || address.county || "",

        region: address.region || address.state_district || "",

        country: address.country_code?.toUpperCase() || "",

        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
      };

      console.log("FINAL CLEAN LOCATION:", cleanLocation);

      onSelect(cleanLocation); // ✅ now parent gets CLEAN data
    } catch (err) {
      console.error("Reverse geocode error:", err);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => fetchLocations(e.target.value)}
        placeholder="Enter your location..."
        className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white  focus:ring-2 focus:ring-primary/20"
      />

      {results.length > 0 && (
        <ul className="absolute bg-white border w-full mt-1 rounded-lg shadow-lg z-50">
          {results.map((place, index) => (
            <li
              key={`${place.place_id}-${index}`}
              onClick={() => handleSelect(place)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
