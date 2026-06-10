import { useState, useEffect } from "react";
import nipple1 from "../assets/nipple1.jpg";
import nastypics1 from "../assets/nastypics1.jpg";
import SlideingCard from "../components/SlideingCard";
import Logo from "../assets/Logo.png";
import { supabase } from "../lib/supabaseClient"; // Assuming you have Supabase configured
import { useAuth } from "../context/AuthContext"; // Assuming you have auth context
import { LoveSpinner } from "../components/Spinner";
import { Link } from "react-router-dom";

function CreditStore() {
  const [currentBalance, setCurrentBalance] = useState(0);
  const [creditPackages, setCreditPackages] = useState([]);
  const [tenCreditPackage, setTenCreditPackage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastPurchaseDate, setLastPurchaseDate] = useState(null);

  const { user } = useAuth(); // Get current user from auth context

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      // Step 1: get user profile ID
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // Step 2: get credit balance using profile ID
      const { data: credits, error: creditError } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", profile.id)
        .single();

      if (creditError) throw creditError;

      setCurrentBalance(credits?.balance ?? 0);
    } catch (error) {
      console.error("Error fetching user balance:", error.message);
    }
  };

  // Fetch credit packages from database
  const fetchCreditPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("active", true) // ✅ correct column name
        .order("credits", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.warn("No active credit packages found");
        setCreditPackages([]);
        return;
      }

      // Separate 10-credit package from main packages
      const tenCreditPkg = data.find((pkg) => pkg.credits === 10);
      const mainPackages = data.filter((pkg) => pkg.credits !== 10);

      // Store 10-credit package separately
      if (tenCreditPkg) {
        setTenCreditPackage({
          id: tenCreditPkg.id,
          name: tenCreditPkg.name,
          credits: tenCreditPkg.credits,
          price: Number(tenCreditPkg.price_usd),
          bonus: tenCreditPkg.bonus_credits || 0,
          pricePerCredit: Number(tenCreditPkg.price_per_credit).toFixed(2),
          features: [
            `${tenCreditPkg.credits} Credits`,
            tenCreditPkg.bonus_credits > 0
              ? `${tenCreditPkg.bonus_credits} Bonus Credits`
              : "No Bonus Credits",
            "Instant Delivery",
            "Secure Payment",
          ],
        });
      }

      // Transform main packages
      const packages = mainPackages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        price: Number(pkg.price_usd),
        bonus: pkg.bonus_credits || 0,
        pricePerCredit: Number(pkg.price_per_credit).toFixed(2),
        popular: pkg.popular || false,
        features: [
          `${pkg.credits} Credits`,
          pkg.bonus_credits > 0
            ? `${pkg.bonus_credits} Bonus Credits`
            : "No Bonus Credits",
          "Instant Delivery",
          "Secure Payment",
        ],
      }));

      setCreditPackages(packages);
    } catch (error) {
      console.error("Error fetching credit packages:", error.message);
    }
  };

  // Fetch user's last purchase date
  const fetchLastPurchaseDate = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      setLastPurchaseDate(data?.created_at || null);
    } catch (error) {
      console.error("Error fetching last purchase:", error);
      setLastPurchaseDate(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Stripe integration function
  const buyCredits = async (packageId) => {
    if (!user) {
      alert("Please login to purchase credits");
      return;
    }

    try {
      // Get user profile ID
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      const res = await fetch("http://localhost:4000/payments/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`, // Add auth token if needed
        },
        body: JSON.stringify({
          user_profile_id: profileData.id,
          package_id: packageId,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // redirect to Stripe
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error("Error initiating purchase:", error);
      alert("Failed to initiate purchase. Please try again.");
    }
  };

  // Handle purchase button click
  const handlePurchase = async (product) => {
    setSelectedProduct(product);

    if (product.type === "credit_package") {
      // Use Stripe for credit packages
      await buyCredits(product.id);
    } else if (product.type === "subscription") {
      // Handle subscription purchase
    }
  };

  // Format price display
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Initialize data on component mount
  useEffect(() => {
    if (!user) return;

    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserBalance(),
        fetchCreditPackages(),
        fetchLastPurchaseDate(),
      ]);
      setLoading(false);
    };

    initializeData();
  }, [user]);

  // Check for successful payment return (when user returns from Stripe)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      const success = urlParams.get("success");

      if (sessionId && success === "true") {
        // Refresh user balance after successful payment
        await Promise.all([
          fetchUserBalance(),
          fetchLastPurchaseDate(), // 👈 refresh after purchase
        ]);

        setShowSuccessModal(true);

        // Clean URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    };

    checkPaymentStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-background flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <LoveSpinner size="large" color="#ff6b6b" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background text-text-primary">
        {/* Hero Section */}
        <section
          className="pt-24 pb-16 bg-gradient-to-br from-primary-50 to-accent-50"
          style={{
            background:
              "linear-gradient(180deg, rgba(177, 54, 17, 0.2) 0%, rgba(32, 7, 13, 0.45) 60%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-serif font-semibold text-text-primary mb-6">
                Unlock Your{" "}
                <span className="text-primary">Dating Potential</span>
              </h1>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
                Boost your connections with premium features designed to help
                you find meaningful relationships faster and more effectively.
              </p>

              {/* Current Balance Display */}
              <div className="inline-flex items-center space-x-4 bg-white rounded-xl py-4 px-4 shadow-card">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {/* svg paths unchanged */}
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-lg font-semibold text-text-primary">
                    Current Balance:
                  </span>
                </div>

                <span className="text-2xl font-bold text-primary">
                  {currentBalance} credits
                </span>

                <div className="text-sm text-text-secondary">
                  <p>
                    Last Purchase:{" "}
                    <span className="font-medium">
                      {formatDate(lastPurchaseDate)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Limited Time Offer Banner */}
        <section
          className="py-4"
          style={{
            backgroundImage: "linear-gradient(to right, #8b4b6b, #d4a574)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-4 text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">
                Limited Time: Get 25% Extra Credits on All Packages!
              </span>
              <span className="text-accent-200 text-sm">
                <p>
                  Last Purchase:{" "}
                  <span className="font-medium">
                    {formatDate(lastPurchaseDate)}
                  </span>
                </p>
              </span>
            </div>
          </div>
        </section>

        {/* Credit Packages Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-text-primary mb-6">
                Choose Your <span className="text-primary">Credit Package</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Flexible credit packages to match your dating goals. No
                subscriptions required -{" "}
                <span className="text-primary">Buy only what you need.</span>
              </p>
            </div>

            {/* Main Packages Grid - Only 300, 500, 1000 credits */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`card hover:shadow-button-hover transition-all duration-300 relative ${
                    pkg.popular ? "border-2 border-primary" : ""
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 right-3 transform -translate-x-1/2">
                      <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-primary "
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {pkg.name.includes("Popular") ? (
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        ) : pkg.name.includes("Premium") ? (
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        ) : (
                          <>
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                              clipRule="evenodd"
                            />
                          </>
                        )}
                      </svg>
                    </div>
                    <h3 className="text-2xl font-serif font-semibold text-text-primary mb-2">
                      {pkg.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-primary">
                        {pkg.credits}
                      </span>
                      <span className="text-text-secondary ml-1">Credits</span>
                    </div>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-text-primary">
                        {formatPrice(pkg.price)}
                      </span>
                      {pkg.bonus > 0 && (
                        <div className="text-sm text-success-600 font-medium">
                          +{pkg.bonus} Bonus Credits
                        </div>
                      )}
                      <div className="text-xs text-text-secondary">
                        ${pkg.pricePerCredit} per credit
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <svg
                          className="w-5 h-5 text-success-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`btn-primary w-full justify-center ${
                      pkg.name.includes("Premium")
                        ? "bg-secondary hover:bg-secondary-600"
                        : ""
                    }`}
                    onClick={() =>
                      handlePurchase({
                        id: pkg.id,
                        name: `${pkg.name} Package`,
                        price: pkg.price,
                        credits: pkg.credits + pkg.bonus,
                        type: "credit_package",
                      })
                    }
                  >
                    Purchase {pkg.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Features Section */}
        <section className="bg-surface">
          <div className="relative min-h-[60vh] sm:min-h-[72vh] lg:min-h-screen flex items-center">
            <img
              src={nipple1}
              alt="Happy couple connecting"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-secondary-800/70 to-accent-800/60" />

            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-4xl pt-20 sm:text-3xl md:text-5xl font-serif font-semibold gradient-text leading-tight mb-6">
                Premium Features
                <span className="text-primary"> Worth Every Credit</span>
              </h2>

              <p className="mx-auto text-xl text-text-secondary text-sm sm:text-base lg:text-lg text-white/90 max-w-3xl mb-6 leading-relaxed">
                Discover what makes StripMe premium features so effective at
                creating meaningful connections
              </p>

              {/* Feature Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {/* Super Connections */}
                <div className="card text-center hover:shadow-button-hover transition-all duration-300">
                  <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-error-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-text-primary mb-3">
                    Super Connections
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Stand out from the crowd. Super connections get 3x more
                    responses than regular likes.
                  </p>
                  <div className="text-sm text-primary font-medium">
                    2 Credits per Super Connection
                  </div>
                  <button
                    className="mt-4 text-primary hover:text-primary-600 font-medium transition-colors duration-300"
                    onClick={() => alert("Super Connections preview feature")}
                  >
                    Try Free Preview →
                  </button>
                </div>

                {/* Premium Messages */}
                <div className="card text-center hover:shadow-button-hover transition-all duration-300">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-text-primary mb-3">
                    Premium Messages
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Send rich media messages with photos, and priority delivery.
                  </p>
                  <div className="text-sm text-primary font-medium">
                    2 Credits per Message
                  </div>
                  <button
                    className="mt-4 text-primary hover:text-primary-600 font-medium transition-colors duration-300"
                    onClick={() => alert("Premium Messages preview feature")}
                  >
                    Try Free Preview →
                  </button>
                </div>

                {/* Profile Boost */}
                <div className="card text-center hover:shadow-button-hover transition-all duration-300">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-secondary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-text-primary mb-3">
                    Profile Boost
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Get 10x more profile views for 30 minutes. Perfect for peak
                    dating hours.
                  </p>
                  <div className="text-sm text-primary font-medium">
                    5 Credits per Boost
                  </div>
                  <button
                    className="mt-4 text-primary hover:text-primary-600 font-medium transition-colors duration-300"
                    onClick={() => alert("Profile Boost preview feature")}
                  >
                    Try Free Preview →
                  </button>
                </div>

                {/* Advanced Filters */}
                <div className="card text-center hover:shadow-button-hover transition-all duration-300">
                  <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-accent-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-text-primary mb-3">
                    Advanced Filters
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Filter by education, lifestyle, interests, and relationship
                    goals for better matches.
                  </p>
                  <div className="text-sm text-primary font-medium">
                    1 Credit per Search
                  </div>
                  <button
                    className="mt-4 text-primary hover:text-primary-600 font-medium transition-colors duration-300"
                    onClick={() => alert("Advanced Filters preview feature")}
                  >
                    Try Free Preview →
                  </button>
                </div>

                {/* Read Receipts */}
                <div className="card text-center hover:shadow-button-hover transition-all duration-300">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-success-600"
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
                  <h3 className="text-xl font-serif font-semibold text-text-primary mb-3">
                    Read Receipts
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Know when your messages are read and optimize your
                    conversation timing.
                  </p>
                  <div className="text-sm text-primary font-medium">
                    1 Credit per Conversation
                  </div>
                  <button
                    className="mt-4 text-primary hover:text-primary-600 font-medium transition-colors duration-300"
                    onClick={() => alert("Read Receipts preview feature")}
                  >
                    Try Free Preview →
                  </button>
                </div>

                {/* Rewind Feature */}
                <div className="card text-center hover:shadow-button-hover transition-all duration-300">
                  <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-warning-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-text-primary mb-3">
                    Rewind
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Accidentally passed on someone? Rewind and get a second
                    chance to connect.
                  </p>
                  <div className="text-sm text-primary font-medium">
                    3 Credits per Rewind
                  </div>
                  <button
                    className="mt-4 text-primary hover:text-primary-600 font-medium transition-colors duration-300"
                    onClick={() => alert("Rewind preview feature")}
                  >
                    Try Free Preview →
                  </button>
                </div>
              </div>

              {/* 10-Credit Package Section - Separated Below Main Grid */}
              {tenCreditPackage && (
                <div className="text-center border border-gray-20 rounded-lg mb-6">
                  <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-8 max-w-2xl mx-auto">
                    <h3 className="text-3xl font-serif font-semibold text-red-200 mb-4">
                      Start Small, Test Premium Features
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Get {tenCreditPackage.credits} credits to test any premium
                      feature. Perfect for trying out the platform before
                      committing to larger packages.
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary">
                          {tenCreditPackage.credits}
                        </div>
                        <div className="text-sm text-white">Credits</div>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {formatPrice(tenCreditPackage.price)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        ${tenCreditPackage.pricePerCredit} per credit
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() =>
                        handlePurchase({
                          id: tenCreditPackage.id,
                          name: `${tenCreditPackage.name} Package`,
                          price: tenCreditPackage.price,
                          credits:
                            tenCreditPackage.credits + tenCreditPackage.bonus,
                          type: "credit_package",
                        })
                      }
                    >
                      Purchase {tenCreditPackage.credits} Credits
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="bg-surface">
          <div className="relative min-h-[60vh] sm:min-h-[72vh] lg:min-h-screen flex items-center">
            <img
              src={nastypics1}
              alt="Happy user"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-secondary-800/70 to-accent-800/60" />
            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-text-primary mt-16 mb-6">
                Secure{" "}
                <span className="gradient-text animate-pulse scale-110">&</span>{" "}
                <span className="text-primary">Trusted</span>
              </h2>
              <p className="text-xl text-white max-w-3xl mx-auto mb-16">
                Your payment information is protected with industry-leading
                security measures.
              </p>

              <div className="grid md:grid-cols-4 gap-12 mb-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    SSL Encrypted
                  </h3>
                  <p className="text-sm text-white/80">
                    256-bit encryption protects all transactions
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    PCI Compliant
                  </h3>
                  <p className="text-sm text-white/80">
                    Meets highest payment security standards
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-secondary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path
                        fillRule="evenodd"
                        d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    No Hidden Fees
                  </h3>
                  <p className="text-sm text-white/80">
                    Transparent pricing with no surprises
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-accent-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Money Back</h3>
                  <p className="text-sm text-white/80">
                    30-day satisfaction guarantee
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-8 max-w-4xl mx-auto">
                <h2 className="text-center text-2xl font-bold my-6">
                  <span className="text-white animate-pulse scale-110">
                    Flirt, vibe and connect with irresistable people from around
                    the world
                  </span>
                  <span className="text-primary">
                    {" "}
                    Your next spark could be just a message away.
                  </span>
                </h2>
                <SlideingCard />
              </div>
              <div className="mt-6 pt-6 border-t border-primary/10">
                <p className="text-sm text-white">
                  <strong className="text-white">Customer Support:</strong>
                  Need help? Contact our support team 24/7 at{" "}
                  <a
                    href="mailto:support@stripme.com"
                    className="text-white hover:text-primary-300"
                  >
                    support@StripMe.com{" "}
                  </a>
                  or call{" "}
                  <a
                    href="tel:+1-800-STRIP-ME"
                    className="text-white hover:text-primary-300"
                  >
                    1-800-STRIP-ME
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-text-primary text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Logo & Name - Centered */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center">
                <img src={Logo} alt="StripMe" className="w-12 h-12" />
                <span className="ml-2 text-xl font-serif font-semibold text-white">
                  StripMe
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

            {/* Copyright */}
            <div className="border-t border-white/10 pt-6 text-center">
              <p className="text-white/50 text-xs">
                stripMe.com © 2026 All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default CreditStore;
