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
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState(null);
  const [user, setUser] = useState(null);

  // Country detection states
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const [detectedCountryName, setDetectedCountryName] = useState("");
  const [countryLocked, setCountryLocked] = useState(false);

  // Form state - Directly on the page now
  const [formData, setFormData] = useState({
    displayName: "",
    gender: "",
    lookingFor: "",
    dateOfBirth: "",
    city: "",
  });

  // Validation errors
  const [errors, setErrors] = useState({
    displayName: "",
    gender: "",
    lookingFor: "",
    dateOfBirth: "",
    city: "",
  });

  // Touch state for showing errors
  const [touched, setTouched] = useState({
    displayName: false,
    gender: false,
    lookingFor: false,
    dateOfBirth: false,
    city: false,
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

  // Check if user already signed in and has profile
  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isMounted || !user) return;

      // Check if profile exists
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        // User has profile, redirect to members
        navigate("/members");
      }
      // If no profile, stay on sign-up page to create one
    };
    checkUser();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Handle unsupported country selection
  const handleUnsupportedCountrySelect = (selectedCountryCode) => {
    setCountry(selectedCountryCode);
    setCountryLocked(true);
    setShowUnsupportedModal(false);
    setAuthMessage(
      `Welcome! You'll be exploring ${SUPPORTED_COUNTRIES[selectedCountryCode]?.name} profiles.`,
    );
    setTimeout(() => setAuthMessage(null), 5000);
  };

  // Auto-detect country on mount
  useEffect(() => {
    const detectCountry = async () => {
      setIsDetectingCountry(true);
      try {
        const result = await detectUserCountry();
        console.log("📍 Detected country:", result);

        setDetectedCountryName(result.countryName);

        if (result.isSupported) {
          setCountry(result.countryCode);
          setCountryLocked(true);
          setShowUnsupportedModal(false);
        } else {
          setShowUnsupportedModal(true);
        }
      } catch (err) {
        console.error("Country detection failed:", err);
        setCountryLocked(false);
      } finally {
        setIsDetectingCountry(false);
      }
    };

    detectCountry();
  }, []);

  // Validation function
  const validateField = (field, value) => {
    switch (field) {
      case "displayName":
        if (!value || value.trim().length < 2) {
          return "The username field is required.";
        }
        return "";
      case "gender":
        if (!value) {
          return "Please select your gender.";
        }
        return "";
      case "lookingFor":
        if (!value) {
          return "Please select who you're looking for.";
        }
        return "";
      case "dateOfBirth":
        if (!value) {
          return "Date of birth required. Select a day.";
        }
        // Check if age is at least 18
        const age = calculateAge(value);
        if (age < 18) {
          return "You must be at least 18 years old.";
        }
        return "";
      case "city":
        // ✅ FIX: Check if location exists AND has a city or name
        if (!value && !location) {
          return "Please select city from dropdown.";
        }
        if (location && !location.city && !location.name) {
          return "Please select a valid city from the dropdown.";
        }
        return "";
      default:
        return "";
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle field change with validation
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate on change
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));

    // Mark as touched
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle blur for validation
  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Handle location selection from LocationInput
  const handleLocationSelect = (place) => {
    console.log("📍 Location selected:", place);

    // ✅ FIX: Store the location data properly
    const locationData = {
      city: place?.city || place?.town || place?.name || "",
      state: place?.state || place?.region || "",
      country: place?.country || country,
      lat: place?.lat || null,
      lng: place?.lng || null,
      formatted_address: place?.formatted_address || "",
    };

    setLocation(locationData);
    setFormData((prev) => ({
      ...prev,
      city: locationData.city,
    }));

    // Validate city
    const error = validateField("city", locationData.city);
    setErrors((prev) => ({ ...prev, city: error }));
    setTouched((prev) => ({ ...prev, city: true }));
  };

  // Check if form is valid
  const isFormValid = () => {
    const displayNameError = validateField("displayName", formData.displayName);
    const genderError = validateField("gender", formData.gender);
    const lookingForError = validateField("lookingFor", formData.lookingFor);
    const dobError = validateField("dateOfBirth", formData.dateOfBirth);
    const cityError = validateField("city", formData.city);

    setErrors({
      displayName: displayNameError,
      gender: genderError,
      lookingFor: lookingForError,
      dateOfBirth: dobError,
      city: cityError,
    });

    const isValid =
      !displayNameError &&
      !genderError &&
      !lookingForError &&
      !dobError &&
      !cityError &&
      country &&
      location;

    console.log("Form valid:", isValid, {
      displayNameError,
      genderError,
      lookingForError,
      dobError,
      cityError,
      country,
      location,
    });

    return isValid;
  };

  // SIGN UP with Email
  const handleEmailSignUp = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      // Mark all fields as touched to show errors
      setTouched({
        displayName: true,
        gender: true,
        lookingFor: true,
        dateOfBirth: true,
        city: true,
      });
      return;
    }

    setSignupLoading(true);
    setSignupMessage(null);

    try {
      const age = calculateAge(formData.dateOfBirth);

      console.log("📝 Creating account with:", {
        email: signupEmail,
        displayName: formData.displayName,
        country: country,
        location: location,
      });

      // Step 1: Sign up
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            display_name: formData.displayName,
            country: country,
          },
        },
      });

      if (error) {
        console.error("❌ Signup error:", error);
        if (error.message.includes("User already registered")) {
          // Try to sign in instead
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: signupEmail,
            password: signupPassword,
          });
          if (loginError) {
            setSignupMessage({
              type: "error",
              text: "Email already exists. Please try logging in instead.",
            });
            return;
          }
          // Login successful - check if profile exists
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: existingProfile } = await supabase
              .from("user_profiles")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();

            if (existingProfile) {
              window.location.replace("/members");
              return;
            }
            // Create profile for existing user
            const { error: profileError } = await supabase
              .from("user_profiles")
              .insert({
                user_id: user.id,
                display_name: formData.displayName,
                country: country,
                city: location?.city || null,
                state: location?.state || null,
                location_latitude: location?.lat || null,
                location_longitude: location?.lng || null,
                gender: formData.gender,
                looking_gender: formData.lookingFor,
                age: age,
                date_of_birth: formData.dateOfBirth || null,
                interests: [],
                email_verified: true,
              });

            if (profileError) {
              console.error("❌ Profile creation error:", profileError);
              setSignupMessage({
                type: "error",
                text: "Failed to create profile. Please try again.",
              });
              return;
            }
            window.location.replace("/members");
            return;
          }
        }
        throw error;
      }

      console.log("✅ User created:", data);

      // Step 2: Manually sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });
      if (signInError) {
        console.error("❌ Sign in error:", signInError);
        // Try to get user anyway
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw signInError;
      }

      // Step 3: Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("❌ Get user error:", userError);
        throw new Error("Could not get user");
      }

      console.log("✅ User authenticated:", user.id);

      // Step 4: Insert profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          display_name: formData.displayName,
          country: country,
          city: location?.city || null,
          state: location?.state || null,
          location_latitude: location?.lat || null,
          location_longitude: location?.lng || null,
          gender: formData.gender,
          looking_gender: formData.lookingFor,
          age: age,
          date_of_birth: formData.dateOfBirth || null,
          interests: [],
          email_verified: true,
        });

      if (profileError) {
        console.error("❌ Profile creation error:", profileError);
        setSignupMessage({
          type: "error",
          text: "Failed to create profile: " + profileError.message,
        });
        return;
      }

      console.log("✅ Profile created successfully!");

      // Step 5: Redirect
      setSignupMessage({ type: "success", text: "Account created!" });
      setTimeout(() => navigate("/members"), 1500);
    } catch (err) {
      console.error("❌ Signup error:", err);
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
        // Check if profile exists
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (profile) {
          navigate("/members");
        } else {
          // User exists but no profile - stay on sign-up page
          setSigninError(
            "Account found but profile is incomplete. Please complete the form to create your profile.",
          );
        }
      }
    } catch (err) {
      setSigninError("Unable to sign in");
    } finally {
      setSigninLoading(false);
    }
  };

  // SIGN IN with Google
  const handleGoogleSignIn = async () => {
    // Validate form before Google sign-up
    if (!isFormValid()) {
      setTouched({
        displayName: true,
        gender: true,
        lookingFor: true,
        dateOfBirth: true,
        city: true,
      });
      return;
    }

    try {
      setGoogleLoading(true);

      const age = calculateAge(formData.dateOfBirth);

      const signupData = {
        displayName: formData.displayName,
        gender: formData.gender,
        lookingFor: formData.lookingFor,
        dateOfBirth: formData.dateOfBirth,
        age: age,
        country: country,
        city: location?.city || null,
        state: location?.state || null,
        location: location,
      };

      localStorage.setItem("signup_data", JSON.stringify(signupData));
      sessionStorage.setItem("signup_data", JSON.stringify(signupData));
      sessionStorage.setItem("auth_intent", "signup");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      setSignupMessage({
        type: "error",
        text: decodeURIComponent(error),
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-text-primary z-10">
      {/* Background slider */}
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

      {/* Overlay */}
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
        />
      )}

      {/* Header */}
      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-50">
          <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <img src={Logo} alt="FlingPals" className="w-10 h-10" />
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

        {/* Google Loading Overlay */}
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

        {/* Main Content */}
        <main className="min-h-screen pt-16">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center">
              <div className="w-full max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  {/* Left benefits */}
                  <div className="hidden lg:block">
                    <div className="max-w-lg mt-8">
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

                  {/* Sign Up Form */}
                  <div className="w-full flex justify-center">
                    <div className="w-full max-w-md">
                      {/* Auth Message */}
                      {authMessage && (
                        <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm text-center">
                          {authMessage}
                        </div>
                      )}

                      {/* Signup Message */}
                      {signupMessage && (
                        <div
                          className={`mb-4 p-3 rounded-lg text-sm text-center ${
                            signupMessage.type === "error"
                              ? "bg-red-500/20 border border-red-500/30 text-red-400"
                              : "bg-green-500/20 border border-green-500/30 text-green-400"
                          }`}
                        >
                          {signupMessage.text}
                        </div>
                      )}

                      <div className="lg:p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 w-full">
                        {/* Mobile heading */}
                        <div className="lg:hidden text-center mb-6">
                          <h1 className="text-3xl font-serif pt-6 font-semibold text-white mb-2">
                            Join StripPals Today
                          </h1>
                          <p className="text-gray-200">
                            Start your journey to meaningful connections
                          </p>
                        </div>

                        {/* Logo & Title - Centered */}
                        <div className="text-center mb-8">
                          <div className="flex justify-center mb-3">
                            <img
                              src={Logo}
                              alt="StripPals"
                              className="w-16 h-16"
                            />
                          </div>
                          <h2 className="text-2xl font-serif font-semibold text-white">
                            Log in
                          </h2>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                          {/* I am (Gender) */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-1.5">
                              I am a
                            </label>
                            <select
                              value={formData.gender}
                              onChange={(e) =>
                                handleFieldChange("gender", e.target.value)
                              }
                              onBlur={() => handleFieldBlur("gender")}
                              className={`w-full border rounded-lg py-3 px-4 bg-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                                touched.gender && errors.gender
                                  ? "border-red-500"
                                  : "border-white/20"
                              }`}
                            >
                              <option value="" className="text-gray-700">
                                Select...
                              </option>
                              <option value="male" className="text-gray-700">
                                Man
                              </option>
                              <option value="female" className="text-gray-700">
                                Woman
                              </option>
                            </select>
                            {touched.gender && errors.gender && (
                              <p className="text-red-400 text-xs mt-1">
                                {errors.gender}
                              </p>
                            )}
                          </div>

                          {/* Looking for */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-1.5">
                              Looking for
                            </label>
                            <select
                              value={formData.lookingFor}
                              onChange={(e) =>
                                handleFieldChange("lookingFor", e.target.value)
                              }
                              onBlur={() => handleFieldBlur("lookingFor")}
                              className={`w-full border rounded-lg py-3 px-4 bg-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                                touched.lookingFor && errors.lookingFor
                                  ? "border-red-500"
                                  : "border-white/20"
                              }`}
                            >
                              <option value="" className="text-gray-700">
                                Select...
                              </option>
                              <option value="male" className="text-gray-700">
                                Men
                              </option>
                              <option value="female" className="text-gray-700">
                                Women
                              </option>
                            </select>
                            {touched.lookingFor && errors.lookingFor && (
                              <p className="text-red-400 text-xs mt-1">
                                {errors.lookingFor}
                              </p>
                            )}
                          </div>

                          {/* Date of Birth */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-1.5">
                              Date of birth
                            </label>
                            <input
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={(e) =>
                                handleFieldChange("dateOfBirth", e.target.value)
                              }
                              onBlur={() => handleFieldBlur("dateOfBirth")}
                              className={`w-full border rounded-lg py-3 px-4 bg-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                                touched.dateOfBirth && errors.dateOfBirth
                                  ? "border-red-500"
                                  : "border-white/20"
                              }`}
                            />
                            {touched.dateOfBirth && errors.dateOfBirth && (
                              <p className="text-red-400 text-xs mt-1">
                                {errors.dateOfBirth}
                              </p>
                            )}
                          </div>

                          {/* City */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-1.5">
                              City
                            </label>
                            {country && (
                              <LocationInput
                                countryCode={country}
                                onSelect={handleLocationSelect}
                                placeholder="Enter a location"
                              />
                            )}
                            {touched.city && errors.city && (
                              <p className="text-red-400 text-xs mt-1">
                                {errors.city}
                              </p>
                            )}
                          </div>

                          {/* Username */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-1.5">
                              Username
                            </label>
                            <input
                              type="text"
                              value={formData.displayName}
                              onChange={(e) =>
                                handleFieldChange("displayName", e.target.value)
                              }
                              onBlur={() => handleFieldBlur("displayName")}
                              className={`w-full border rounded-lg py-3 px-4 bg-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                                touched.displayName && errors.displayName
                                  ? "border-red-500"
                                  : "border-white/20"
                              }`}
                              placeholder="Choose a username"
                            />
                            {touched.displayName && errors.displayName && (
                              <p className="text-red-400 text-xs mt-1">
                                {errors.displayName}
                              </p>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-white/20"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-4 bg-black/40 text-gray-400">
                                Choose how you want to sign up
                              </span>
                            </div>
                          </div>

                          {/* Sign Up Buttons */}
                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={handleGoogleSignIn}
                              className="w-full flex items-center justify-center space-x-3 py-3 border border-white/20 rounded-lg bg-white/90 hover:bg-white/100 transition-all duration-300 text-black font-medium"
                            >
                              <svg
                                className="w-5 h-5"
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
                              Sign up with Google
                            </button>

                            <button
                              type="button"
                              onClick={handleEmailSignUp}
                              disabled={signupLoading}
                              className="w-full py-3 border border-white/20 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 text-white font-medium"
                            >
                              {signupLoading
                                ? "Creating account..."
                                : "Sign up with Email"}
                            </button>
                          </div>

                          {/* Sign In Link */}
                          <div className="text-center mt-6 pt-6 border-t border-white/20">
                            <p className="text-gray-300 text-sm">
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
                      </div>

                      {/* Security badge */}
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

        {/* Sign In Modal */}
        {showSignIn && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-sm rounded-2xl max-w-md w-full relative p-6 border border-white/20">
              <button
                onClick={() => {
                  setShowSignIn(false);
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
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setShowSignIn(false);
                      handleGoogleSignIn();
                    }}
                    className="w-full flex items-center justify-center space-x-3 py-3 border border-white/20 rounded-lg bg-white/90 hover:bg-white/100 transition-all duration-300 text-black font-medium"
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

                <div className="text-center text-sm text-gray-300 mt-2">or</div>

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
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Small helper component */
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
