// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SlideingCard from "../components/SlideingCard";
import SlidingCardTwo from "../components/SlidingCardTwo";
import Logo from "../assets/Logo.png";
import home from "../assets/home_img/home.jpg";
import home1 from "../assets/home_img/home1.jpg";
import home2 from "../assets/home_img/home2.jpg";
import home3 from "../assets/home_img/home3.jpg";
import home4 from "../assets/home_img/home4.jpg";
import home5 from "../assets/home_img/home5.jpg";
import home6 from "../assets/home_img/home6.jpg";
import home7 from "../assets/home_img/home7.jpg";
import home8 from "../assets/home_img/home8.jpg";
import home9 from "../assets/home_img/home9.jpg";
import home10 from "../assets/home_img/home10.jpg";
import VideoCard from "../components/VideoCard";
import StripMe_vid from "../assets/home_img/StripMe_vid.mp4";
import dating from "../assets/home_img/dating.jpeg";
import engage from "../assets/home_img/engage.jpeg";
import found_love from "../assets/home_img/found_love.jpeg";

// ✅ Check localStorage BEFORE component renders (outside component)
const getInitialDisclaimerState = () => {
  const hasAgreed = localStorage.getItem("disclaimerAgreed");
  const agreedDate = localStorage.getItem("disclaimerAgreedDate");

  if (hasAgreed === "true" && agreedDate) {
    const daysSinceAgreement =
      (Date.now() - parseInt(agreedDate)) / (1000 * 60 * 60 * 24);
    if (daysSinceAgreement < 30) {
      return false; // Already agreed, don't show modal
    }
    // Clear expired agreement
    localStorage.removeItem("disclaimerAgreed");
    localStorage.removeItem("disclaimerAgreedDate");
  }
  return true; // Show modal
};

function Home({ intervalMs = 5000, transitionMs = 800 }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // ✅ Initialize state with the result from localStorage check (no blinking!)
  const [showDisclaimer, setShowDisclaimer] = useState(
    getInitialDisclaimerState,
  );

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const images = [
    home,
    home1,
    home2,
    home3,
    home4,
    home5,
    home6,
    home7,
    home8,
    home9,
    home10,
  ];

  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);

  // preload images once
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // rotation timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [intervalMs, images.length]);

  const handleNext = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIndex((i) => (i + 1) % images.length);

    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
  };

  const handleConfirmAndContinue = () => {
    localStorage.setItem("disclaimerAgreed", "true");
    localStorage.setItem("disclaimerAgreedDate", Date.now().toString());
    setShowDisclaimer(false);
  };

  const handleLeaveWebsite = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <>
      {/* Main Homepage Content - always rendered */}
      <main className="bg-background text-text-primary">
        <header
          className="fixed top-0 left-0 right-0 z-50"
          aria-hidden={mobileOpen ? "false" : "false"}
        >
          <div
            className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300`}
          >
            <nav
              className="flex items-center justify-between h-16"
              aria-label="Primary"
            >
              {/* Left: Logo */}
              <div className="flex items-center space-x-3">
                <Link to="/" className="inline-flex items-center">
                  <img src={Logo} alt="StripPals" className="h-10 w-auto" />
                  <span className="ml-2 text-lg gradient-text font-serif font-semibold text-white/90 hidden sm:inline">
                    StripPals
                  </span>
                </Link>
              </div>

              {/* Right: CTA + mobile toggle */}
              <div className="flex items-center space-x-3">
                <Link
                  to="/sign-up"
                  className=" sm:inline text-sm font-medium text-white/80 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>

                <Link
                  to="/sign-up"
                  className="sm:inline-block px-4 text-gradient-text py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:scale-[1.01] transition-transform duration-200"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgb(104, 48, 57), #f7d1aaff)",
                  }}
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
          {/* Background images stacked and faded */}
          <div className="absolute inset-0 z-0">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                aria-hidden
                onError={(e) => {
                  if (!e.target.dataset.fallback) {
                    e.target.dataset.fallback = "true";
                    e.target.src =
                      "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
                  }
                }}
                loading={i === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[${transitionMs}ms] ${
                  i === index ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                style={{ transitionDuration: `${transitionMs}ms` }}
              />
            ))}

            {/* dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-secondary-800/70 to-accent-800/60" />
          </div>

          {/* Hero Content (z-10) */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-serif font-semibold text-white mb-6 leading-tight">
                Where Authentic{" "}
                <span className="text-accent-300 font-accent italic">
                  Connections
                </span>{" "}
                Begin
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Join thousands who've discovered meaningful relationships
                through our sophisticated matching algorithms and gamified
                interactions. Your story starts here.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-6 mb-10 text-white/80">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-success-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    50,000+ Active Members
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-success-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    2,500+ Success Stories
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-success-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">SSL Secured</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/sign-up"
                  className="btn-primary text-lg px-8 py-4 bg-primary hover:bg-primary-600 transform hover:scale-105 transition-all duration-300"
                >
                  Start Your Journey Free
                </Link>

                <button
                  className="flex items-center space-x-2 text-white hover:text-accent-200 transition-colors duration-300 group"
                  onClick={handleNext}
                >
                  <svg
                    className="w-12 h-12 bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-all duration-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Watch Success Stories</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
            <svg
              className="w-6 h-6 text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </section>

        {/* Interactive Matching Preview */}
        <section className="py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-text-primary mb-6">
                Experience Our{" "}
                <span className="text-primary">Smart Matching</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                See how our sophisticated algorithms create meaningful
                connections based on compatibility, interests, and relationship
                goals.
              </p>
            </div>

            <section className="w-full bg-gradient-to-br from-primary-50 to-accent-50 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Left Side - Video */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative rounded-xl overflow-hidden shadow-2xl">
                      <div className="aspect-video">
                        <VideoCard
                          src={StripMe_vid}
                          poster="/path/to/poster.jpg"
                          title="StripPals - Quick Preview"
                          controls={true}
                          autoplay={true}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* Video badge */}
                    <div className="absolute -bottom-3 -right-3 bg-white rounded-full px-3 py-1 shadow-md">
                      <span className="text-xs font-semibold text-primary">
                        🎥 Watch Demo
                      </span>
                    </div>
                  </div>

                  {/* Right Side - Compatibility Content */}
                  <div className="space-y-6">
                    <div>
                      <div className="inline-block px-3 py-1 bg-primary/10 rounded-full mb-4">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          AI-Powered Matching
                        </span>
                      </div>
                      <h4 className="text-3xl md:text-4xl font-serif font-bold text-text-primary mb-2">
                        Why You're
                        <span className="text-primary"> Compatible</span>
                      </h4>
                      <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                    </div>

                    <div className="space-y-3">
                      {[
                        "Both love outdoor adventures",
                        "Similar career ambitions",
                        "Shared values on relationships",
                        "Different but complementary personalities",
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:translate-x-1 transition-transform duration-200"
                        >
                          <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          </div>
                          <span className="text-text-secondary">{item}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to="/sign-up"
                      className="inline-flex items-center justify-center px-8 py-3 text-primary rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                    >
                      Find Your Match
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-text-primary mb-6">
                Real Love Stories,{" "}
                <span className="text-primary">Real Results</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Join thousands of couples who found their perfect match through
                StripPals' intelligent matching system.
              </p>
            </div>

            {/* Success Cards*/}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Story 1 */}
              <div className="card hover:shadow-button-hover transition-all duration-300">
                <div className="relative mb-6">
                  <img
                    src={found_love}
                    alt="Emma and James In Love"
                    className="w-full h-48 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-medium text-success-600">
                      In Love
                    </span>
                  </div>
                  <blockquote className="text-text-secondary mb-4 italic">
                    "We matched on StripPals and knew instantly we had something
                    special. The compatibility score was 96%, and it was spot
                    on!"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="flex -space-x-2">
                      <img
                        src={found_love}
                        alt="Emma"
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        loading="lazy"
                      />
                      <img
                        src={found_love}
                        alt="James"
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Emma & James
                      </p>
                      <p className="text-sm text-text-secondary">
                        Together 2 years
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Story 2 */}
              <div className="card hover:shadow-button-hover transition-all duration-300">
                <div className="relative mb-6">
                  <img
                    src={engage}
                    alt="Micheal and Lisa engagement"
                    className="w-full h-48 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-medium text-primary">
                      Engaged
                    </span>
                  </div>
                </div>
                <blockquote className="text-text-secondary mb-4 italic">
                  "The gamified approach made dating fun again. We bonded over
                  challenges and discovered we're perfect for each other!"
                </blockquote>
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <img
                      src={engage}
                      alt="Lisa"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      loading="lazy"
                    />
                    <img
                      src={engage}
                      alt="Michael"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">
                      Lisa & Michael
                    </p>
                    <p className="text-sm text-text-secondary">
                      Together 18 months
                    </p>
                  </div>
                </div>
              </div>

              {/* Story 3 */}
              <div className="card hover:shadow-button-hover transition-all duration-300">
                <div className="relative mb-6">
                  <img
                    src={dating}
                    alt="David and Racheal together"
                    className="w-full h-48 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-medium text-accent-700">
                      Dating
                    </span>
                  </div>
                </div>
                <blockquote className="text-text-secondary mb-4 italic">
                  "StripPals helped us connect on a deeper level from day one.
                  The conversation starters were amazing!"
                </blockquote>
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <img
                      src={dating}
                      alt="Rachel"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      loading="lazy"
                    />
                    <img
                      src={dating}
                      alt="David"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">
                      Rachel & David
                    </p>
                    <p className="text-sm text-text-secondary">
                      Together 8 months
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* View More Stories */}
            <div className="text-center mt-12">
              <Link
                to="/sign-up"
                className="inline-flex items-center space-x-2 text-primary hover:text-primary-600 font-medium transition-colors duration-300"
              >
                <span>Read More Success Stories</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Platform Statistics */}
        <section
          className="py-20 bg-gradient-to-br from-primary-50 to-accent-50"
          style={{
            backgroundImage: "linear-gradient(to right, #f5f3f0ff, #f7d1aaff)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-text-primary mb-6">
                Trusted by <span className="text-primary">Thousands</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Join a thriving community where meaningful connections happen
                every day.
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  50K+
                </div>
                <p className="text-text-secondary font-medium">
                  Active Members
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">
                  2.5K+
                </div>
                <p className="text-text-secondary font-medium">
                  Success Stories
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-accent-700 mb-2">
                  94%
                </div>
                <p className="text-text-secondary font-medium">
                  Match Satisfaction
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-success-600 mb-2">
                  1M+
                </div>
                <p className="text-text-secondary font-medium">Messages Sent</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Security */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-text-primary mb-6">
                Your Safety is Our{" "}
                <span className="text-primary">Priority</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Advanced security measures and verification systems ensure a
                safe, authentic dating environment.
              </p>
            </div>

            {/* Security Features */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-success-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Profile Verification
                </h3>
                <p className="text-text-secondary">
                  Multi-step verification process ensures authentic profiles and
                  real people.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  End-to-End Encryption
                </h3>
                <p className="text-text-secondary">
                  All messages and personal data are encrypted with military
                  grade security.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  24/7 Support
                </h3>
                <p className="text-text-secondary">
                  Round the clock moderation and support team to ensure safe
                  interactions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <img
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3"
                alt="SSL Certificate"
                className="h-12 object-contain grayscale"
                loading="lazy"
              />
              <div className="flex items-center space-x-2">
                <svg
                  className="w-8 h-8 text-success-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-text-secondary">
                  GDPR Compliant
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-8 h-8 text-success-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-text-secondary">
                  256-bit SSL
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="relative  flex items-center justify-center overflow-hidden 
            h-156"
          style={{
            backgroundImage: "linear-gradient(to right, #f5f3f0ff, #f7d1aaff)",
          }}
        >
          <div className="absolute inset-0 z-0">
            <SlideingCard />
            <SlidingCardTwo />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-secondary-800/70 to-accent-800/60" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-white mb-6">
                Ready to Find Your
                <span className="text-accent-200 font-accent italic">
                  Perfect Match?
                </span>
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands who've discovered meaningful relationships. Your
                story starts with a single click.
              </p>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                With thousands of women looking for a (sex) flirt, you are
                guaranteed to make your dreams come true! When will YOU become a
                member?
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/sign-up"
                  className="btn-primary bg-white text-primary hover:bg-accent-50 text-lg px-8 py-4 transform hover:scale-105 transition-all duration-300"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #f5f3f0ff, #f7d1aaff)",
                  }}
                >
                  Create Free Account
                </Link>

                <Link
                  to="/sign-up"
                  className="text-white hover:text-accent-200 font-medium transition-colors duration-300"
                >
                  Learn How It Works →
                </Link>
              </div>

              {/* Final Trust Indicator */}
              <div className="mt-8 text-white/70 text-sm">
                <p>Free to join • No credit card required • Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-text-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Logo & Name - Centered */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center">
                <img src={Logo} alt="StripPals" className="w-12 h-12" />
                <span className="ml-2 text-xl font-serif font-semibold text-white">
                  StripPals
                </span>
              </div>
            </div>

            {/* Legal Links Row */}
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
            </div>

            {/* Informational Text */}
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

            {/* Copyright */}
            <div className="border-t border-white/10 pt-6 text-center">
              <p className="text-white/50 text-xs">
                stripPals.com © 2026 All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Disclaimer Modal Overlay - appears on top of the homepage */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/60  z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-black rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    Important Notice
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Please read carefully before proceeding
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="max-h-[30vh] overflow-y-auto  bg-white p-6 md:p-8 space-y-4 text-black text-md leading-relaxed">
              <p>Please be kindly reminded of the following matters:</p>

              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  You must be at least 18-years old and the age of majority in
                  your place of residence to enter the Website. Parents, please
                  use the Parental Control Bar to control what your children see
                  online.
                </li>
                <li>
                  The purpose of this website is to enable chat conversations
                  between fictitious profiles and users and therefore partly
                  contain fictitious profiles. Physical meetings are not
                  possible with these fictitious profiles.
                </li>
                <li>
                  Privacy and General Terms and Conditions apply to this
                  service.
                </li>
              </ol>

              <p className="font-semibold mt-4">
                You state that the following facts are accurate:
              </p>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  I am at least 18-years old and the age of majority in my place
                  of residence.
                </li>
                <li>I will not redistribute any material from the Website.</li>
                <li>
                  I will not allow any minors to access the Website or any
                  material found in it.
                </li>
                <li>
                  Any material I view or download from the Website is for my own
                  personal use and I will not show it to a minor.
                </li>
                <li>
                  I was not contacted by the suppliers of this material, and I
                  willingly choose to view or download it.
                </li>
                <li>
                  I acknowledge that the Website includes fantasy profiles
                  created and operated by the Website that may communicate with
                  me for promotional and other purposes.
                </li>
                <li>
                  I acknowledge that individuals appearing in photos on the
                  landing page or in fantasy profiles might not be actual
                  members of the Website and that certain data is provided for
                  illustration purposes only.
                </li>
                <li>
                  I acknowledge that the Website does not inquire into the
                  background of its members and the Website does not otherwise
                  attempt to verify the accuracy of statements made by its
                  members.
                </li>
                <li>
                  I acknowledge that the Website does not guarantee that I will
                  find a date or that I will meet any of its members in person
                  or that any given person or profile manifested on the Website
                  is available or interested in dating or communicating with me
                  or anyone else.
                </li>
                <li>
                  I acknowledge that my use of the Website is governed by the
                  Website's Terms of Service Agreement and the Website's Privacy
                  Policy, which I have carefully reviewed and accepted, and I am
                  legally bound by the Terms of Service Agreement and the
                  Privacy Policy.
                </li>
                <li>
                  By entering the Website, I am subjecting myself to the
                  exclusive personal jurisdiction of the United Kingdom should
                  any dispute arise between the owner or operator of the Website
                  and myself in accordance with the Terms of Service Agreement.
                </li>
                <li>
                  By entering the Website, I am subjecting myself to binding
                  arbitration in the United Kingdom should any dispute arise at
                  any time between the owner or operator of the Website and
                  myself in accordance with the Terms of Service Agreement.
                </li>
                <li>
                  By entering the Website, I will have released and discharged
                  the providers, owners, and creators of the Website from all
                  liability that might arise.
                </li>
                <li>
                  By entering the Website, my personal data will be stored and
                  processed, in accordance with the Privacy Statement.
                </li>
              </ul>

              <p className="font-semibold text-center pt-4">
                By clicking Confirm and continue, you state that all the above
                is true, that you want to enter the Website, and that you agree
                to the Terms of Service Agreement.
              </p>
            </div>

            {/* Buttons */}
            <div className="p-6 md:p-8 border-t border-gray-200 bg-black">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleConfirmAndContinue}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition font-semibold"
                >
                  Confirm and continue
                </button>
                <button
                  onClick={handleLeaveWebsite}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-white hover:bg-gray-50 transition font-semibold"
                >
                  Leave this website
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;
