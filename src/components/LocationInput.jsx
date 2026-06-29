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
        `https://api.locationiq.com/v1/autocomplete?key=${
          import.meta.env.VITE_LOCATIONIQ_KEY
        }&q=${value}&countrycodes=${countryCode}&limit=5&normalizecity=1&addressdetails=1`,
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

      console.log("FULL LOCATIONIQ RESPONSE:", data);

      const address = data.address || {};

      const cleanLocation = {
        city:
          address.city ||
          address.town ||
          address.village ||
          address.hamlet ||
          "",

        state: address.state_code || address.state || "",

        country: address.country || "",

        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
      };

      console.log("FINAL CLEAN LOCATION:", cleanLocation);

      onSelect(cleanLocation);
    } catch (err) {
      console.error("Reverse geocode error:", err);
    }
  };

  // const handleSelect = async (place) => {
  //   setQuery(place.display_name);
  //   setResults([]);

  //   try {
  //     const res = await fetch(
  //       `https://api.locationiq.com/v1/reverse?key=${import.meta.env.VITE_LOCATIONIQ_KEY}&lat=${place.lat}&lon=${place.lon}&format=json`,
  //     );

  //     const data = await res.json();
  //     const address = data.address || {};

  //     const cleanLocation = {
  //       city:
  //         address.city ||
  //         address.town ||
  //         address.village ||
  //         address.hamlet ||
  //         "",

  //       state: address.state || address.county || "",

  //       region: address.region || address.state_district || "",

  //       country: address.country_code?.toUpperCase() || "",

  //       lat: parseFloat(place.lat),
  //       lng: parseFloat(place.lon),
  //     };

  //     console.log("FINAL CLEAN LOCATION:", cleanLocation);

  //     onSelect(cleanLocation); // ✅ now parent gets CLEAN data
  //   } catch (err) {
  //     console.error("Reverse geocode error:", err);
  //   }
  // };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => fetchLocations(e.target.value)}
        placeholder="Enter your location..."
        className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:ring-2 focus:ring-primary/20"
      />

      {results.length > 0 && (
        <ul className="absolute bg-white border w-full mt-1 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
          {results.map((place, index) => {
            const address = place.address || {};

            const city =
              address.city ||
              address.town ||
              address.village ||
              address.hamlet ||
              "";

            const state = address.state_code || address.state || "";

            const country = address.country_code?.toUpperCase() || "";

            return (
              <li
                key={`${place.place_id}-${index}`}
                onClick={() => handleSelect(place)}
                className="w-full border border-black rounded-lg py-3 px-4 bg-white text-black focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <div className="font-medium">
                  {city}
                  {state ? ` ${state}` : ""}
                  {country ? `, ${country}` : ""}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
