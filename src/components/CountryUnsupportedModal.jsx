// src/components/CountryUnsupportedModal.jsx
import React, { useState } from "react";
import { SUPPORTED_COUNTRIES } from "../utils/countryDetection";

export default function CountryUnsupportedModal({
  detectedCountry,
  onSelectCountry,
}) {
  const [selectedCountry, setSelectedCountry] = useState("US");

  const countryOptions = Object.values(SUPPORTED_COUNTRIES);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-sm rounded-2xl max-w-2xl w-full relative p-8 border border-white/20 max-h-[90vh] overflow-y-auto">
        {/* No close button - user must make a choice */}

        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-4xl">🌍</span>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-white mb-2">
            We're Expanding to Your Country!
          </h2>
          <p className="text-gray-300">
            We detected that you're in{" "}
            <strong className="text-white">{detectedCountry}</strong>. While
            we're working on bringing our platform to your region, you can still
            explore our community in these countries:
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <p className="text-amber-400 text-sm text-center">
            🚀 Choose a country below to start connecting with people there.
            Your profile will be visible to users in that country.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <label className="block text-white font-medium mb-2">
            Select a country to explore:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {countryOptions.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country.code)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedCountry === country.code
                    ? "border-primary bg-primary/20 text-white"
                    : "border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/40"
                }`}
              >
                <div className="text-lg font-semibold">{country.code}</div>
                <div className="text-xs text-gray-400">{country.name}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSelectCountry(selectedCountry)}
          className="w-full py-3 px-6 rounded-lg bg-primary hover:bg-primary-600 text-white transition font-medium"
        >
          Continue with {SUPPORTED_COUNTRIES[selectedCountry]?.name}
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Your data is protected. We'll notify you when we launch in{" "}
            {detectedCountry}.
          </p>
        </div>
      </div>
    </div>
  );
}
