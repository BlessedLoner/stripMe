// src/pages/SignUp.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import home1 from "../assets/home_img/home1.jpg";
import home2 from "../assets/home_img/home2.jpg";
import home3 from "../assets/home_img/home3.jpg";
import { supabase } from "../lib/supabaseClient";
import { COUNTRIES } from "../components/countries";
import LocationInput from "../components/LocationInput";
import {
  detectUserCountry,
  SUPPORTED_COUNTRY_CODES,
  SUPPORTED_COUNTRIES,
} from "../utils/countryDetection";
import CountryUnsupportedModal from "../components/CountryUnsupportedModal";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [showSignIn, setShowSignIn] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(true);
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState(null);
  const [user, setUser] = useState(null);

  // NEW: Country detection states
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const [detectedCountryName, setDetectedCountryName] = useState("");
  const [countryLocked, setCountryLocked] = useState(false);

  // user details modal fields
  const [userDetails, setUserDetails] = useState({
    displayName: "",
    gender: "",
    lookingFor: "",
    age: "",
    city: "",
    dateOfBirth: "",
    interests: [],
    relationshipGoal: "",
  });

  // slider
  const slides = [home1, home2, home3];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  // // Auto-detect country on mount
  // useEffect(() => {
  //   const detectCountry = async () => {
  //     setIsDetectingCountry(true);
  //     try {
  //       const result = await detectUserCountry();
  //       console.log("📍 Detected country:", result);

  //       setDetectedCountry(result.countryCode);
  //       setDetectedCountryName(result.countryName);

  //       if (result.isSupported) {
  //         // User is from a supported country - lock their country
  //         setCountry(result.countryCode);
  //         setCountryLocked(true);
  //         setShowUnsupportedModal(false);
  //       } else {
  //         // User is from an unsupported country - show modal
  //         setShowUnsupportedModal(true);
  //         // Don't set country yet, let them choose
  //       }
  //     } catch (err) {
  //       console.error("Country detection failed:", err);
  //       // Fallback: allow manual selection
  //       setCountryLocked(false);
  //     } finally {
  //       setIsDetectingCountry(false);
  //     }
  //   };

  //   detectCountry();
  // }, []);

  // signup form states
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState(null);

  // signin modal states
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinLoading, setSigninLoading] = useState(false);
  const [signinError, setSigninError] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Auth Message
  useEffect(() => {
    const message = sessionStorage.getItem("auth_message");
    if (message) {
      setAuthMessage(message);
      sessionStorage.removeItem("auth_message");
      setTimeout(() => setAuthMessage(null), 5000);
    }
  }, []);

  // general auth listener to redirect if already signed in
  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isMounted || !user) return;
      console.log("User detected on signup page:", user.id);
      setShowUserDetailsModal(true);
    };
    checkUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle unsupported country modal - user selects a country
  const handleUnsupportedCountrySelect = (selectedCountryCode) => {
    setCountry(selectedCountryCode);
    setCountryLocked(true);
    setShowUnsupportedModal(false);
    // Show a success message
    setAuthMessage(
      `Welcome! You'll be exploring ${SUPPORTED_COUNTRIES[selectedCountryCode]?.name} profiles.`,
    );
    setTimeout(() => setAuthMessage(null), 5000);
  };

  // Auto-detect country on mount - UPDATED
  useEffect(() => {
    const detectCountry = async () => {
      setIsDetectingCountry(true);
      try {
        const result = await detectUserCountry();
        console.log("📍 Detected country:", result);

        setDetectedCountryName(result.countryName);

        if (result.isSupported) {
          // User is from a supported country - lock their country
          setCountry(result.countryCode);
          setCountryLocked(true);
          setShowUnsupportedModal(false);
        } else {
          // User is from an unsupported country - show modal
          setShowUnsupportedModal(true);
          // Don't set country yet, let them choose
        }
      } catch (err) {
        console.error("Country detection failed:", err);
        // Fallback: allow manual selection
        setCountryLocked(false);
      } finally {
        setIsDetectingCountry(false);
      }
    };

    detectCountry();
  }, []);

  // Handle unsupported country selection - UPDATED (no close handler needed)
  const handleUnsupportedCountrySelect = (selectedCountryCode) => {
    setCountry(selectedCountryCode);
    setCountryLocked(true);
    setShowUnsupportedModal(false);
    // Show a success message
    setAuthMessage(
      `Welcome! You'll be exploring ${SUPPORTED_COUNTRIES[selectedCountryCode]?.name} profiles.`,
    );
    setTimeout(() => setAuthMessage(null), 5000);
  };

  // helper handlers
  const handleUserDetailsChange = (field, value) => {
    setUserDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInterestToggle = (interest) => {
    setUserDetails((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleUserDetailsSubmit = (e) => {
    e.preventDefault();
    if (!isUserDetailsComplete) return;

    const dataToSave = {
      displayName: userDetails.displayName,
      gender: userDetails.gender,
      lookingFor: userDetails.lookingFor,
      age: userDetails.age,
      dateOfBirth: userDetails.dateOfBirth,
      interests: userDetails.interests,
      relationshipGoal: userDetails.relationshipGoal,
      country: country,
      city: location?.city || null,
      state: location?.state || null,
      location: location,
    };

    localStorage.setItem("signup_data", JSON.stringify(dataToSave));
    console.log("✅ Saved:", dataToSave);
    setShowUserDetailsModal(false);
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupMessage(null);

    try {
      // Step 1: Sign up
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            display_name: userDetails.displayName,
            country: country, // ✅ Store the selected country
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: signupEmail,
            password: signupPassword,
          });
          if (loginError) {
            setSignupMessage({
              type: "error",
              text: "Email already exists. Try logging in instead.",
            });
            return;
          }
          window.location.replace("/members");
          return;
        }
        throw error;
      }

      // Step 2: Manually sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });
      if (signInError) throw signInError;

      // Step 3: Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Could not get user");

      // Step 4: Insert profile with country
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          display_name: userDetails.displayName,
          country: country, // ✅ Use the detected/selected country
          city: location?.city || null,
          state: location?.state || null,
          location_latitude: location?.lat || null,
          location_longitude: location?.lng || null,
          gender: userDetails.gender,
          looking_gender: userDetails.lookingFor,
          age: parseInt(userDetails.age),
          interests: userDetails.interests,
          date_of_birth: userDetails.dateOfBirth || null,
        });

      if (profileError) throw profileError;

      // Step 5: Redirect
      setSignupMessage({ type: "success", text: "Account created!" });
      setTimeout(() => navigate("/members"), 1500);
    } catch (err) {
      console.error("Signup error:", err);
      setSignupMessage({ type: "error", text: err.message });
    } finally {
      setSignupLoading(false);
    }
  };

  // SIGN IN with email & password
  const handleEmailSignIn = async (e) => {
    e && e.preventDefault();
    setSigninLoading(true);
    setSigninError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signinEmail,
        password: signinPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setSigninError(
            "Invalid credentials. If you signed up with Google, please continue with Google.",
          );
        } else {
          setSigninError(error.message);
        }
      } else {
        navigate("/members");
      }
    } catch (err) {
      setSigninError("Unable to sign in");
    } finally {
      setSigninLoading(false);
    }
  };

  // SIGN IN with Google
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      localStorage.setItem(
        "signup_data",
        JSON.stringify({
          ...userDetails,
          location,
          country,
        }),
      );
      sessionStorage.setItem("auth_intent", "signup");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        setGoogleLoading(false);
        setSignupMessage({ type: "error", text: error.message });
      }
    } catch (err) {
      setGoogleLoading(false);
      setSignupMessage({ type: "error", text: "Google sign-in failed." });
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

  const isUserDetailsComplete =
    userDetails.displayName &&
    userDetails.gender &&
    userDetails.lookingFor &&
    userDetails.age &&
    userDetails.dateOfBirth &&
    userDetails.interests.length > 0 &&
    country &&
    location;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isNewUser = params.get("newUser");
    if (isNewUser) {
      setShowUserDetailsModal(true);
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-text-primary z-10">
      {/* Background slider - unchanged */}
      <div
        className="bg-slider"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {[home1, home2, home3].map((src, i) => (
          <div
            key={i}
            className="bg-slide"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100vh",
              backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
              transform: "translateZ(0)",
              willChange: "opacity",
              opacity: i === index ? 1 : 0,
              transition: "opacity 1000ms ease-in-out",
            }}
          />
        ))}
      </div>

      {/* Overlay - unchanged */}
      <div
        className="bg-overlay"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(6,8,15,0.35), rgba(6,8,15,0.5))",
        }}
      />

      {/* Unsupported Country Modal */}
      {showUnsupportedModal && (
        <CountryUnsupportedModal
          detectedCountry={detectedCountryName}
          onSelectCountry={handleUnsupportedCountrySelect}
          onClose={handleUnsupportedModalClose}
          onContinue={handleUnsupportedCountrySelect}
        />
      )}

      {/* User Details Modal - UPDATED with country detection */}
      {showUserDetailsModal && !showUnsupportedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/90 backdrop-blur-sm rounded-2xl max-w-2xl w-full relative p-8 border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              {authMessage && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
                  <div
                    className={`px-6 py-3 rounded-lg shadow-lg ${
                      authMessage.includes("Welcome")
                        ? "bg-green-500"
                        : "bg-red-500"
                    } text-white`}
                  >
                    {authMessage}
                  </div>
                </div>
              )}
              <h2 className="text-3xl font-serif font-semibold text-white mb-2">
                Tell Us About Yourself
              </h2>
              <p className="text-gray-200">
                Help us find your perfect matches by sharing a few details
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">
                  Step 1 of 3
                </span>
                <span className="text-sm text-gray-200">Preference Setup</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: "40%" }}
                />
              </div>
            </div>

            <form onSubmit={handleUserDetailsSubmit} className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={userDetails.displayName}
                  onChange={(e) =>
                    handleUserDetailsChange("displayName", e.target.value)
                  }
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
                    value={userDetails.gender}
                    onChange={(e) =>
                      handleUserDetailsChange("gender", e.target.value)
                    }
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
                    value={userDetails.lookingFor}
                    onChange={(e) =>
                      handleUserDetailsChange("lookingFor", e.target.value)
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

              {/* Country and City - UPDATED with detection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Country *
                  </label>

                  {/* If country is detected and locked (supported) */}
                  {countryLocked && country ? (
                    <div className="w-full border border-white/20 rounded-lg py-3 px-4 bg-white/10 text-white flex items-center justify-between">
                      <span>
                        {SUPPORTED_COUNTRIES[country]?.name || country}
                      </span>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Auto-detected
                      </span>
                    </div>
                  ) : (
                    /* Manual selection fallback (if detection failed) */
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                      disabled={isDetectingCountry}
                    >
                      <option value="">
                        {isDetectingCountry
                          ? "Detecting your country..."
                          : "Select Country"}
                      </option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {countryLocked && country && (
                    <p className="text-xs text-gray-400 mt-1">
                      {isDetectingCountry
                        ? "Detecting..."
                        : "✅ Your country was auto-detected"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    City / Region*
                  </label>
                  {country && (
                    <LocationInput
                      countryCode={country}
                      onSelect={(place) => {
                        console.log("PLACE:", place);
                        setLocation(place);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Age and Date of birth - unchanged */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={userDetails.age}
                    onChange={(e) =>
                      handleUserDetailsChange("age", e.target.value)
                    }
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
                    value={userDetails.dateOfBirth}
                    onChange={(e) =>
                      handleUserDetailsChange("dateOfBirth", e.target.value)
                    }
                    className="w-full border border-white/20 rounded-lg py-3 px-4 bg-black text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              {/* Interests - unchanged */}
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
                        userDetails.interests.includes(interest)
                          ? "bg-primary border-primary text-white"
                          : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                      } ${
                        userDetails.interests.length >= 5 &&
                        !userDetails.interests.includes(interest)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={
                        userDetails.interests.length >= 5 &&
                        !userDetails.interests.includes(interest)
                      }
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Selected: {userDetails.interests.length}/5
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignIn(true);
                    setShowUserDetailsModal(false);
                  }}
                  className="flex-1 py-3 px-6 border border-white/20 rounded-lg bg-primary text-white hover:bg-white/10"
                >
                  Already have an account? Login
                </button>

                <button
                  type="submit"
                  disabled={!isUserDetailsComplete}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors duration-300 ${
                    isUserDetailsComplete
                      ? "bg-primary hover:bg-primary-600 text-white"
                      : "bg-gray-600 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  Continue to Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rest of the component remains the same... */}
      {/* Header */}
      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-50">
          <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  {Logo ? (
                    <img src={Logo} alt="FlingPals" className="w-10 h-10" />
                  ) : (
                    <svg
                      className="w-10 h-10 text-primary"
                      viewBox="0 0 40 40"
                      fill="currentColor"
                    >
                      <path d="M20 4C12.268 4 6 10.268 6 18c0 5.523 3.178 10.297 7.8 12.6.4.2.8-.1.8-.5v-2.2c-3.9.8-4.7-1.9-4.7-1.9-.6-1.6-1.5-2-1.5-2-1.2-.8.1-.8.1-.8 1.3.1 2 1.3 2 1.3 1.2 2 3.1 1.4 3.9 1.1.1-.9.5-1.4.9-1.8-2.9-.3-6-1.5-6-6.6 0-1.5.5-2.7 1.3-3.6-.1-.3-.6-1.6.1-3.2 0 0 1.1-.4 3.5 1.3 1-.3 2.1-.4 3.2-.4s2.2.1 3.2.4c2.4-1.7 3.5-1.3 3.5-1.3.7 1.6.2 2.9.1 3.2.8.9 1.3 2.1 1.3 3.6 0 5.1-3.1 6.3-6 6.6.5.4.9 1.2.9 2.4v3.6c0 .4.4.7.8.5C30.822 28.297 34 23.523 34 18c0-7.732-6.268-14-14-14z" />
                      <circle cx="20" cy="20" r="3" fill="currentColor" />
                    </svg>
                  )}
                </Link>
              </div>

              <div className="flex items-center">
                <span className="text-gray-200 text-sm mr-2">
                  Already have an account?
                </span>
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-primary hover:text-primary-400 font-medium transition-colors duration-300"
                >
                  Sign In
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* Google Loading Overlay - unchanged */}
        {googleLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-black rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full mx-4 border border-white/20">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                <div className="relative bg-white rounded-full p-3">
                  <svg className="w-10 h-10" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-10 h-10 border-4 border-white border-t-white rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Redirecting to Google
              </h3>
              <p className="text-white/60 text-sm">Please wait a moment...</p>
            </div>
          </div>
        )}

        {/* Main - unchanged */}
        <main className="min-h-screen pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center">
              <div className="w-full max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  {/* Left benefits - unchanged */}
                  <div className="hidden lg:block">
                    <div className="max-w-lg">
                      <h1 className="text-4xl md:text-5xl font-serif font-semibold text-white mb-6 leading-tight">
                        Your Perfect Match is{" "}
                        <span className="text-primary font-accent italic">
                          Waiting
                        </span>
                      </h1>
                      <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                        Join thousands who've found meaningful relationships
                        through our intelligent matching system and authentic
                        community.
                      </p>
                      <div className="space-y-4 mb-8">
                        <Benefit label="Advanced compatibility matching" />
                        <Benefit label="Verified profiles for authentic connections" />
                        <Benefit label="Safe & secure messaging platform" />
                        <Benefit label="Interactive icebreakers & conversation starters" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-1">
                            50K+
                          </div>
                          <p className="text-sm text-gray-200">
                            Active Members
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-secondary mb-1">
                            2.5K+
                          </div>
                          <p className="text-sm text-gray-200">
                            Success Stories
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Registration Card - unchanged */}
                  <div className="w-full flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-200">
                            Step 2 of 3
                          </span>
                          <span className="text-sm text-gray-200">
                            Account Setup
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: "60%" }}
                          />
                        </div>
                      </div>

                      <div className="lg:p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 w-full">
                        <div className="lg:hidden text-center mb-6">
                          <h1 className="text-3xl font-serif pt-6 font-semibold text-white mb-2">
                            Join StripPals Today
                          </h1>
                          <p className="text-gray-200">
                            Start your journey to meaningful connections
                          </p>
                        </div>

                        <div className="w-full">
                          <form
                            onSubmit={handleEmailSignUp}
                            className="space-y-4"
                          >
                            <div>
                              <label className="block text-sm text-gray-200 mb-2">
                                Email
                              </label>
                              <input
                                type="email"
                                required
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                className="w-full border border-white/20 rounded-lg py-3 px-4 bg-white text-black focus:border-primary focus:ring-2 focus:ring-primary/20"
                                placeholder="you@example.com"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-gray-200 mb-2">
                                Password
                              </label>
                              <input
                                type="password"
                                required
                                value={signupPassword}
                                onChange={(e) =>
                                  setSignupPassword(e.target.value)
                                }
                                className="w-full border border-white/20 rounded-lg py-3 px-4 bg-white text-black focus:border-primary focus:ring-2 focus:ring-primary/20"
                                placeholder="Create a password"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={signupLoading}
                              className="w-full bg-primary hover:bg-primary-600 text-white font-medium py-3 rounded-lg transition-colors duration-300"
                            >
                              {signupLoading
                                ? "Creating account..."
                                : "Create account"}
                            </button>

                            <div className="text-center text-sm text-gray-300">
                              or
                            </div>

                            <div className="space-y-3">
                              <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                className="w-full flex items-center justify-center space-x-3 py-3 border border-white/20 rounded-lg bg-white/90 hover:bg-white/100 transition-all duration-300 text-black"
                              >
                                <svg
                                  className="w-5 h-5 mr-2"
                                  viewBox="0 0 533.5 544.3"
                                >
                                  <path
                                    fill="#4285f4"
                                    d="M533.5 278.4c0-17.4-1.6-34.3-4.6-50.7H272v95.9h147.1c-6.4 34.8-25.8 64.3-55 84.1v69.8h88.8c51.9-47.8 82.6-118.1 82.6-198.9z"
                                  />
                                  <path
                                    fill="#34a853"
                                    d="M272 544.3c73.7 0 135.6-24.4 180.8-66.2l-88.8-69.8c-24.7 16.6-56.6 26.5-92 26.5-70.8 0-130.9-47.8-152.4-112.1H28.6v70.7C73.8 486.2 167.9 544.3 272 544.3z"
                                  />
                                  <path
                                    fill="#fbbc04"
                                    d="M119.6 325.7c-10.2-30.7-10.2-63.7 0-94.4V160.6H28.6c-39.6 78.7-39.6 174.9 0 253.6l91-88.5z"
                                  />
                                  <path
                                    fill="#ea4335"
                                    d="M272 108.4c39.9 0 75.8 13.7 104.1 40.6l78-78C406.9 24.2 344.9 0 272 0 167.9 0 73.8 58.1 28.6 160.6l91 88.5C141.1 156.2 201.2 108.4 272 108.4z"
                                  />
                                </svg>
                                Continue with Google
                              </button>

                              {signupMessage && (
                                <div
                                  className={`text-sm mt-2 ${
                                    signupMessage.type === "error"
                                      ? "text-red-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  {signupMessage.text}
                                </div>
                              )}
                            </div>
                          </form>
                        </div>

                        <div className="text-center mt-6 pt-6 border-t border-white/20">
                          <p className="text-gray-200">
                            Already have an account?{" "}
                            <button
                              onClick={() => setShowSignIn(true)}
                              className="text-primary hover:text-primary-400 font-medium transition-colors duration-300"
                            >
                              Sign In
                            </button>
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 text-center">
                        <div className="flex items-center justify-center space-x-2 text-xs text-gray-300">
                          <svg
                            className="w-4 h-4 text-green-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Your data is protected with 256-bit SSL encryption
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer - unchanged */}
        <footer className="bg-text-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center mb-8">
              <div className="flex items-center">
                <img src={Logo} alt="StripPals" className="w-12 h-12" />
                <span className="ml-2 text-xl font-serif font-semibold text-white">
                  StripPals
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/70 mb-8">
              <Link to="/protect" className="hover:text-white transition">
                Protect our children!
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/terms" className="hover:text-white transition">
                Terms of use
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/privacy" className="hover:text-white transition">
                Privacy
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/cookies" className="hover:text-white transition">
                Cookies
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/complaint" className="hover:text-white transition">
                Complaint policy
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/2257" className="hover:text-white transition">
                2257
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/dmca" className="hover:text-white transition">
                DMCA
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/pricing" className="hover:text-white transition">
                Pricing
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/contact" className="hover:text-white transition">
                Contact
              </Link>
              <span className="text-white/30">/</span>
              <Link to="/affiliates" className="hover:text-white transition">
                Affiliates
              </Link>
            </div>

            <div className="text-center text-white/60 text-xs leading-relaxed max-w-4xl mx-auto mb-6">
              <p>
                The minimum age for participation on stripPals.com is 18 years.
                The site is optimised for desktops, mobile phones and tablets.
                stripPals.com is a social platform for men and women who are
                looking for fun, flirty contact. Every day, hundreds of members
                sign up. Based on your profile settings, you will receive match
                suggestions. However, you can also use our search functionality
                and browse for profiles yourself. This is completely up to you.
                stripPals.com is designed for entertainment. Profiles are partly
                fictional, physical arrangements with these profiles are not
                possible. We strongly advise you to read our Terms and
                Conditions before using our Service.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6 text-center">
              <p className="text-white/50 text-xs">
                stripPals.com © 2026 All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        {/* Sign In Modal - unchanged */}
        {showSignIn && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-sm rounded-2xl max-w-md w-full relative p-6 border border-white/20">
              <button
                onClick={() => {
                  setShowSignIn(false);
                  setShowUserDetailsModal(true);
                }}
                className="absolute top-4 right-4 text-white hover:text-primary"
                aria-label="Close sign in"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="w-full">
                <h3 className="text-xl text-white mb-4">Sign In</h3>

                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      className="w-full border border-white/20 rounded-lg py-3 px-4 bg-gray-200 text-black focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-200 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      className="w-full border border-white/20 rounded-lg py-3 px-4 bg-gray-200 text-black focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {signinError && (
                    <div className="text-sm text-red-400">{signinError}</div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={signinLoading}
                      className="flex-1 py-3 bg-primary text-white rounded-lg"
                    >
                      {signinLoading ? "Signing in..." : "Sign In"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSigninLoading(true);
                        supabase.auth
                          .signInWithOtp({ email: signinEmail })
                          .then(({ error }) => {
                            setSigninLoading(false);
                            if (error) setSigninError(error.message);
                            else {
                              setShowSignIn(false);
                              alert("Magic link sent to your email.");
                            }
                          });
                      }}
                      className="flex-1 py-3 border border-white/20 rounded-lg text-white"
                    >
                      Send Magic Link
                    </button>
                  </div>

                  <div className="text-center text-sm text-gray-300 mt-2">
                    or
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setShowSignIn(false);
                        handleGoogleSignIn();
                      }}
                      className="w-full flex items-center justify-center space-x-3 py-3 border border-white/20 rounded-lg bg-white/90 hover:bg-white/100 transition-all duration-300 text-black"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 533.5 544.3">
                        <path
                          fill="#4285f4"
                          d="M533.5 278.4c0-17.4-1.6-34.3-4.6-50.7H272v95.9h147.1c-6.4 34.8-25.8 64.3-55 84.1v69.8h88.8c51.9-47.8 82.6-118.1 82.6-198.9z"
                        />
                        <path
                          fill="#34a853"
                          d="M272 544.3c73.7 0 135.6-24.4 180.8-66.2l-88.8-69.8c-24.7 16.6-56.6 26.5-92 26.5-70.8 0-130.9-47.8-152.4-112.1H28.6v70.7C73.8 486.2 167.9 544.3 272 544.3z"
                        />
                        <path
                          fill="#fbbc04"
                          d="M119.6 325.7c-10.2-30.7-10.2-63.7 0-94.4V160.6H28.6c-39.6 78.7-39.6 174.9 0 253.6l91-88.5z"
                        />
                        <path
                          fill="#ea4335"
                          d="M272 108.4c39.9 0 75.8 13.7 104.1 40.6l78-78C406.9 24.2 344.9 0 272 0 167.9 0 73.8 58.1 28.6 160.6l91 88.5C141.1 156.2 201.2 108.4 272 108.4z"
                        />
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Small helper component - unchanged */
function Benefit({ label = "" }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
        <svg
          className="w-4 h-4 text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span className="text-gray-200">{label}</span>
    </div>
  );
}
