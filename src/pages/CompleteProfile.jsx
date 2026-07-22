// src/pages/CompleteProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Logo from "../assets/Logo.png";
import { COUNTRIES } from "../components/countries";
import LocationInput from "../components/LocationInput";
import {
  SUPPORTED_COUNTRY_CODES,
  SUPPORTED_COUNTRIES,
} from "../utils/countryDetection";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [recoveryData, setRecoveryData] = useState(null);
  const [formData, setFormData] = useState({
    displayName: "",
    gender: "",
    lookingFor: "",
    age: "",
    dateOfBirth: "",
    interests: [],
    relationshipGoal: "",
    country: "",
    city: "",
    state: "",
    location: null,
  });

  // Get query params for error message
  const queryParams = new URLSearchParams(location.search);
  const errorParam = queryParams.get("error");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get the current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("No user found:", userError);
          navigate("/sign-up");
          return;
        }

        setUser(user);

        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        // If profile exists, redirect to members
        if (existingProfile) {
          navigate("/members");
          return;
        }

        // Try to recover signup_data from localStorage
        let savedData = null;
        try {
          const rawData = localStorage.getItem("signup_data");
          if (rawData) {
            savedData = JSON.parse(rawData);
          }
        } catch (e) {
          console.error("Error parsing saved data:", e);
        }

        // Try sessionStorage as fallback
        if (!savedData) {
          try {
            const rawData = sessionStorage.getItem("signup_data");
            if (rawData) {
              savedData = JSON.parse(rawData);
            }
          } catch (e) {
            console.error("Error parsing session data:", e);
          }
        }

        // Try recovery data from AuthCallback
        if (!savedData) {
          try {
            const rawData = sessionStorage.getItem("auth_recovery");
            if (rawData) {
              const recovery = JSON.parse(rawData);
              if (recovery.user_id === user.id) {
                savedData = recovery.data;
                setRecoveryData(recovery);
              }
            }
          } catch (e) {
            console.error("Error parsing recovery data:", e);
          }
        }

        if (savedData) {
          setFormData({
            displayName: savedData.displayName || "",
            gender: savedData.gender || "",
            lookingFor: savedData.lookingFor || "",
            age: savedData.age || "",
            dateOfBirth: savedData.dateOfBirth || "",
            interests: savedData.interests || [],
            relationshipGoal: savedData.relationshipGoal || "",
            country: savedData.country || "",
            city: savedData.city || "",
            state: savedData.state || "",
            location: savedData.location || null,
          });
        }

        if (errorParam) {
          setError(decodeURIComponent(errorParam));
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(
          "Failed to load your profile data. Please try signing up again.",
        );
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, errorParam]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !formData.displayName ||
        !formData.gender ||
        !formData.lookingFor ||
        !formData.age ||
        !formData.dateOfBirth ||
        !formData.country ||
        !formData.location
      ) {
        setError("Please fill in all required fields.");
        setSubmitting(false);
        return;
      }

      if (formData.interests.length === 0) {
        setError("Please select at least one interest.");
        setSubmitting(false);
        return;
      }

      // Create the profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          display_name: formData.displayName,
          country: formData.country,
          city: formData.location?.city || null,
          state: formData.location?.state || null,
          location_latitude: formData.location?.lat || null,
          location_longitude: formData.location?.lng || null,
          gender: formData.gender,
          looking_gender: formData.lookingFor,
          age: parseInt(formData.age),
          interests: formData.interests,
          relationship_goals: formData.relationshipGoal
            ? [formData.relationshipGoal]
            : [],
          date_of_birth: formData.dateOfBirth || null,
          email_verified: true,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        setError(
          profileError.message || "Failed to create profile. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      // Clean up
      localStorage.removeItem("signup_data");
      sessionStorage.removeItem("signup_data");
      sessionStorage.removeItem("auth_recovery");

      setSuccess(true);

      // Redirect to members after a moment
      setTimeout(() => {
        navigate("/members");
      }, 1500);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const interestsList = [
    "Kissing",
    "Safe sex",
    "Public sex",
    "Anal sex",
    "Bondage",
    "Erotic massage",
    "Lingerie",
    "Oral sex",
    "Exchanging photos",
    "Threesome",
    "Sadomasochism",
    "Group sex",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-sm rounded-2xl max-w-2xl w-full relative p-8 border border-white/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src={Logo} alt="StripPals" className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-serif font-semibold text-white mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-400">
            {errorParam
              ? "We had trouble completing your signup. Please fill in your details below."
              : "Almost there! Let's complete your profile."}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 text-sm">
              ✅ Profile created successfully! Redirecting...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-white font-medium mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange("displayName", e.target.value)}
              className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="How should we call you?"
              required
            />
          </div>

          {/* Gender and Looking For */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">
                I am *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Man</option>
                <option value="female">Woman</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Looking for *
              </label>
              <select
                value={formData.lookingFor}
                onChange={(e) =>
                  handleInputChange("lookingFor", e.target.value)
                }
                className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="">Select preference</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
              </select>
            </div>
          </div>

          {/* Country and City */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Country *
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                City / Region*
              </label>
              {formData.country && (
                <LocationInput
                  countryCode={formData.country}
                  onSelect={(place) => {
                    handleInputChange("location", place);
                    handleInputChange("city", place?.city || "");
                    handleInputChange("state", place?.state || "");
                  }}
                />
              )}
            </div>
          </div>

          {/* Age and Date of Birth */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Age *</label>
              <input
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Enter your age"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-white font-medium mb-3">
              Interests (Select up to 5)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
              {interestsList.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    formData.interests.includes(interest)
                      ? "bg-primary border-primary text-white"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  } ${
                    formData.interests.length >= 5 &&
                    !formData.interests.includes(interest)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={
                    formData.interests.length >= 5 &&
                    !formData.interests.includes(interest)
                  }
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Selected: {formData.interests.length}/5
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || success}
            className={`w-full py-3 rounded-lg transition-colors duration-300 ${
              submitting || success
                ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                : "bg-primary hover:bg-primary-600 text-white"
            }`}
          >
            {submitting
              ? "Saving..."
              : success
                ? "✅ Profile Complete!"
                : "Complete Profile"}
          </button>

          {/* Sign In Link */}
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/sign-up")}
                className="text-primary hover:text-primary-400 transition"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
