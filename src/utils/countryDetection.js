// src/utils/countryDetection.js

export const SUPPORTED_COUNTRY_CODES = ["US", "GB", "CA", "AU", "ZA"];

export const SUPPORTED_COUNTRIES = {
  US: { code: "US", name: "United States" },
  GB: { code: "GB", name: "United Kingdom" },
  CA: { code: "CA", name: "Canada" },
  AU: { code: "AU", name: "Australia" },
  ZA: { code: "ZA", name: "South Africa" },
};

// Helper to get country name from code
export function getCountryName(code) {
  return SUPPORTED_COUNTRIES[code]?.name || code;
}

export async function detectUserCountry() {
  try {
    // Primary API - ipapi.co (no registration needed, 1000 requests/day)
    const response = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.country_code) {
      throw new Error("No country code in response");
    }

    const countryCode = data.country_code.toUpperCase();
    const countryName = data.country_name || data.country || countryCode;
    const isSupported = SUPPORTED_COUNTRY_CODES.includes(countryCode);

    console.log("📍 Country detected:", {
      countryCode,
      countryName,
      isSupported,
    });

    return {
      countryCode,
      countryName,
      isSupported,
    };
  } catch (error) {
    console.warn(
      "Primary IP detection failed, trying fallback:",
      error.message,
    );

    // Fallback: ip-api.com (no registration needed, 45 requests/min)
    try {
      const fallbackResponse = await fetch("https://ip-api.com/json/", {
        headers: { Accept: "application/json" },
      });

      if (!fallbackResponse.ok) {
        throw new Error(`HTTP ${fallbackResponse.status}`);
      }

      const data = await fallbackResponse.json();

      if (!data.countryCode) {
        throw new Error("No country code in fallback response");
      }

      const countryCode = data.countryCode.toUpperCase();
      const countryName = data.country || countryCode;
      const isSupported = SUPPORTED_COUNTRY_CODES.includes(countryCode);

      console.log("📍 Country detected (fallback):", {
        countryCode,
        countryName,
        isSupported,
      });

      return {
        countryCode,
        countryName,
        isSupported,
      };
    } catch (fallbackError) {
      console.warn("Fallback detection also failed:", fallbackError.message);

      // Final fallback - default to US
      console.warn("⚠️ Using default country: US");
      return {
        countryCode: "US",
        countryName: "United States",
        isSupported: true,
      };
    }
  }
}
