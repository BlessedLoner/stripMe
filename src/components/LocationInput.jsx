import { useState } from "react";

export default function LocationInput({ onSelect, countryCode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const fetchLocations = async (value) => {
    setQuery(value);

    if (value.length < 1) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          value,
        )}&filter=countrycode:${countryCode.toLowerCase()}&limit=8&apiKey=${
          import.meta.env.VITE_GEOAPIFY_KEY
        }`,
      );

      const data = await res.json();

      setResults(data.features || []);
    } catch (err) {
      console.error("Location fetch error:", err);
    }
  };
  const handleSelect = (place) => {
    const props = place.properties;

    const cleanLocation = {
      city: props.city || "",
      state: props.state || "",
      country: props.country || "",
      lat: props.lat,
      lng: props.lon,
    };

    setQuery(
      [props.city, props.state, props.country].filter(Boolean).join(", "),
    );

    setResults([]);

    onSelect(cleanLocation);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => fetchLocations(e.target.value)}
        placeholder="Enter your location..."
        className="border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:ring-2 focus:ring-primary/20"
      />

      {results.length > 0 && (
        <ul className="absolute bg-white border w-full mt-1 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
          {results.map((place, index) => {
            const props = place.properties;

            return (
              <li
                key={index}
                onClick={() => handleSelect(place)}
                className="w-full border border-black rounded-lg py-3 px-4 bg-white text-black focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {[props.city, props.state, props.country]
                  .filter(Boolean)
                  .join(", ")}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
