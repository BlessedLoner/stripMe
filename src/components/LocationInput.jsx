import { useState } from "react";

export default function LocationInput({ onSelect, countryCode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const fetchLocations = async (value) => {
    setQuery(value);

    if (!value.trim()) {
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
        className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:ring-2 focus:ring-primary/20"
      />

      {results.map((place, index) => {
        const props = place.properties;

        return (
          <li
            key={index}
            onClick={() => handleSelect(place)}
            className="p-3 hover:bg-gray-100 cursor-pointer text-black"
          >
            {[props.city, props.state, props.country]
              .filter(Boolean)
              .join(", ")}
          </li>
        );
      })}
    </div>
  );
}
