// src/components/MembersFromDB.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import LoveButton from "../components/LoveButton";
import sexy_pic from "../assets/sexy_pic.jpg";
import Logo from "../assets/Logo.png";
import { REGIONS } from "../data/regions";
import { LoveSpinner } from "../components/Spinner";

export default function MembersFromDB({ limit = 200 }) {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 90,
    distance: "50",
    lookingFor: "",
    state: "",
    searchQuery: "",
  });

  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileId, setUserProfileId] = useState(null);
  const [toast, setToast] = useState(null);

  const [regions, setRegions] = useState([]);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const membersPerPage = 20;

  // const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const totalPages = Math.ceil(totalCount / membersPerPage);

  // const indexOfLastMember = currentPage * membersPerPage;
  // const indexOfFirstMember = indexOfLastMember - membersPerPage;

  // const currentMembers = filteredMembers.slice(
  //   indexOfFirstMember,
  //   indexOfLastMember,
  // );

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    setLoadingPage(true);
    setTimeout(() => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setLoadingPage(false);
    }, 300);
  };

  const [debouncedQuery, setDebouncedQuery] = useState(filters.searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(filters.searchQuery), 300);
    return () => clearTimeout(t);
  }, [filters.searchQuery]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("AUTH USER:", user);

      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setUserProfileId(data.id);

      console.log("DB USER PROFILE:", data);
      console.log("DB ERROR:", error);

      if (!error && data) {
        setCurrentUser(data);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser?.country) return;

    async function loadStates() {
      const { data, error } = await supabase
        .from("states")
        .select("state_name")
        .eq("country_code", currentUser.country)
        .order("state_name");

      if (error) {
        console.error("Failed loading states:", error);
        return;
      }

      setRegions(data || []);
    }

    loadStates();
  }, [currentUser?.country]);

  useEffect(() => {
    if (!currentUser) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    // New adding

    // End

    async function fetchFiltered() {
      try {
        // let q = supabase.from("fictional_profiles").select("*");
        let q = supabase
          .from("fictional_profiles")
          .select("*", { count: "exact" });

        if (currentUser?.country) {
          q = q.eq("country", currentUser.country);
        }

        q = q.eq("is_deleted", false);

        if (filters.minAge != null) q = q.gte("age", filters.minAge);
        if (filters.maxAge != null) q = q.lte("age", filters.maxAge);

        if (debouncedQuery) {
          const like = `%${debouncedQuery}%`;
          q = q.or(`display_name.ilike.${like},bio.ilike.${like}`);
        }

        q = q.order("shuffle_order", { ascending: true });

        const { data, count, error: qErr } = await q;

        if (!mounted) return;

        if (qErr) throw qErr;

        // setTotalCount(count || 0);

        let results = Array.isArray(data) ? data : [];

        // Added start
        // Default: no fallback
        setShowFallbackMessage(false);

        if (filters.state) {
          // Find selected state
          const { data: stateRow } = await supabase
            .from("states")
            .select("id")
            .eq("country_code", currentUser.country)
            .eq("state_name", filters.state)
            .single();

          let neighborNames = [];

          if (stateRow) {
            const { data: neighborRows } = await supabase
              .from("state_neighbors")
              .select("neighbor_state_id")
              .eq("state_id", stateRow.id);

            const ids = neighborRows?.map((r) => r.neighbor_state_id) || [];

            if (ids.length) {
              const { data: states } = await supabase
                .from("states")
                .select("state_name")
                .in("id", ids);

              neighborNames = states?.map((s) => s.state_name) || [];
            }
          }

          const selected = [];
          const neighbors = [];
          const others = [];

          for (const profile of results) {
            if (profile.state === filters.state) {
              selected.push(profile);
            } else if (neighborNames.includes(profile.state)) {
              neighbors.push(profile);
            } else {
              others.push(profile);
            }
          }

          if (selected.length === 0) {
            setShowFallbackMessage(true);
            setSelectedState(filters.state);
          }

          results = [...selected, ...neighbors, ...others];
        }

        if (filters.state && results.length === 0) {
          setShowFallbackMessage(true);
          setSelectedState(filters.state);
        } else {
          setShowFallbackMessage(false);
        }

        const start = (currentPage - 1) * membersPerPage;
        const end = start + membersPerPage;

        setTotalCount(results.length);
        setFilteredMembers(results.slice(start, end));
      } catch (err) {
        if (mounted) {
          setError(err);
          setFilteredMembers([]);
          setShowFallbackMessage(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchFiltered();

    return () => {
      mounted = false;
    };
  }, [
    currentUser,
    filters.minAge,
    filters.maxAge,
    filters.state,
    debouncedQuery,
    currentPage,
  ]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img
            src={sexy_pic}
            alt="Happy couple connecting"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
            }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-primary-900/80 via-secondary-800/70 to-accent-800/60"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-3xl md:text-4xl font-serif font-semibold text-white mb-4">
            Discover people. Start real conversations
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/90 mb-6 line-clamp-4 md:line-clamp-none">
            Connect with people who inspire you and start real conversations
            that go beyond small talk. Every message is a chance to uncover
            laughter, share dreams, and build something genuine. Your next
            connection is waiting someone who truly gets you, who values your
            words and your time. Don’t just scroll through profiles; open the
            door to meaningful chats that could turn into unforgettable bonds.
            The right person may only be one message away, and the journey
            begins right here, with you."{" "}
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-white/80">
                Real Conversation
              </span>
              <span className="text-xs sm:text-sm font-semibold text-white">
                95% Connected
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2 sm:h-3">
              <div
                className="bg-linear-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #8b4b6b, #d4a574)",
                }}
              ></div>
            </div>
            <div className="flex flex-wrap justify-between gap-2 mt-2 text-[10px] sm:text-xs text-white/70">
              <span>✓ Best Profiles</span>
              <span>✓ Ready For Meet</span>
              <span className="text-white font-medium">✓ Interests</span>
              <span>✓ Preferences</span>
              <span>✓ Verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black text-white px-4 py-2 rounded-xl shadow-lg text-sm animate-fadeIn">
            {toast}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <section className="card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h2 className="text-2xl text-center font-serif font-semibold text-text-primary">
                Find Your Match
              </h2>
              <p className="text-gray-600 mt-2">
                Refine your search with advanced filters
              </p>
            </div>

            {/* Search Bar */}
            <div className="mt-4 lg:mt-0 lg:w-80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or interests..."
                  className=" search-input w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                  value={filters.searchQuery}
                  onChange={(e) =>
                    handleFilterChange("searchQuery", e.target.value)
                  }
                />
                <svg
                  className="absolute left-3 top-2/3  transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Age Range */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Age Range
              </label>
              <div className="flex items-center space-x-3">
                <select
                  className="flex-1 form-input bg-gray-100 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                  value={filters.minAge}
                  onChange={(e) =>
                    handleFilterChange("minAge", parseInt(e.target.value))
                  }
                >
                  {Array.from({ length: 82 }, (_, i) => i + 18).map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500 font-medium">to</span>
                <select
                  className="flex-1 form-input bg-gray-100 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                  value={filters.maxAge}
                  onChange={(e) =>
                    handleFilterChange("maxAge", parseInt(e.target.value))
                  }
                >
                  {Array.from({ length: 82 }, (_, i) => i + 18)
                    .reverse()
                    .map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block tex-sm font-semibold text-gray-900 mb-3">
                Distance
              </label>
              <select
                className="w-full form-input bg-gray-100 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                value={filters.distance}
                onChange={(e) => handleFilterChange("distance", e.target.value)}
              >
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
                <option value="100">Within 100 miles</option>
                <option value="anywhere">Anywhere</option>
              </select>
            </div>

            {/* Looking For */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Looking For
              </label>
              <select
                className="w-full form-input bg-gray-100 border-0 rounded-x2 py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                value={filters.lookingFor}
                onChange={(e) =>
                  handleFilterChange("lookingFor", e.target.value)
                }
              >
                <option value="">All types</option>
                <option value="long-term">Long-term relationship</option>
                <option value="casual">Something casual</option>
                <option value="friends">New friends</option>
                <option value="benefits">Friends with benefits</option>
                <option value="networking">Professional networking</option>
                <option value="hookup">Hookup</option>
                <option value="unsure">Not sure yet</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Location
              </label>
              <select
                className="w-full form-input bg-gray-100 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                value={filters.state}
                onChange={(e) => handleFilterChange("state", e.target.value)}
              >
                <option value="">All regions</option>

                {regions.map((state) => (
                  <option key={state.state_name} value={state.state_name}>
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-center lg:text-right w-full">
                <div className="text-2xl font-bold text-red-300">
                  {filteredMembers.length}
                </div>
                <div className="text-sm text-primary">matches found</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Members Grid */}
      <section className="card py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-4">Members</h2>
          {loading ? (
            <div className="text-center py-16">
              <LoveSpinner size="large" color="#ff6b6b" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No matches found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters to see more members
              </p>
            </div>
          ) : (
            <>
              {/* Responsive Grid - Mobile: 1, Tablet: 2, Desktop: 3-4, Large: 5 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {showFallbackMessage && (
                  <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
                    <h3 className="text-lg font-semibold text-amber-900">
                      📍 No members available in {selectedState} yet
                    </h3>

                    <p className="mt-2 text-sm text-amber-700">
                      We're growing every day. While we add more members in this
                      region, we'll recommend other members you may also like.
                    </p>
                  </div>
                )}
                {filteredMembers.map((m) => {
                  let imgSrc = null;
                  if (m.image_url && m.image_url.startsWith("http"))
                    imgSrc = m.image_url;
                  else if (Array.isArray(m.photos) && m.photos.length > 0)
                    imgSrc = m.photos[0];
                  else if (
                    typeof m.photos === "string" &&
                    m.photos.startsWith("{")
                  ) {
                    const arr = m.photos
                      .slice(1, -1)
                      .split(",")
                      .map((s) => s.trim());
                    if (arr.length) imgSrc = arr[0];
                  }

                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl overflow-hidden  cursor-pointer hover:scale-105 transition-transform duration-200 border border-primary/20 flex flex-col"
                    >
                      {/* Image Section */}
                      <div className="relative w-full aspect-10/5 overflow-hidden">
                        <button
                          onClick={() =>
                            navigate(`/profile/${m.id}`, {
                              state: { member: m },
                            })
                          }
                          className="w-full h-60 object-cover"
                        >
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={m.display_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                No image
                              </span>
                            </div>
                          )}
                        </button>

                        {/* Online Badge */}
                        <div className="absolute top-2 right-2">
                          <div className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            <span>Online</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                              {m.display_name}
                            </h3>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              {m.age
                                ? `${m.age} years old`
                                : "Age not specified"}
                            </p>
                          </div>
                          <div className="flex items-center text-yellow-400">
                            <svg
                              className="w-4 h-4 fill-current"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>

                        <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2 flex-1">
                          {m.bio || "No bio yet"}
                        </p>

                        <div className="flex items-center gap-2 mt-auto">
                          <button
                            onClick={() =>
                              navigate(`/profile/${m.id}`, {
                                state: { member: m },
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 text-white py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                            style={{
                              backgroundImage:
                                "linear-gradient(to right, #8b4b6b, #d4a574)",
                            }}
                          >
                            <span>Message</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                            >
                              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8A8.5 8.5 0 0114.5 3 8.5 8.5 0 0121 11.5z" />
                              <path d="M12 10.5c-1-1.5-3-1.5-4 0-1 1.5 2 3.5 4 5 2-1.5 5-3.5 4-5-1-1.5-3-1.5-4 0z" />
                            </svg>
                          </button>

                          <LoveButton
                            showToast={showToast}
                            fictionalProfileId={m.id}
                            userProfileId={userProfileId}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1 || loadingPage}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #8b4b6b, #d4a574)",
                    }}
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {(() => {
                      let pages = [];
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, currentPage + 2);

                      if (startPage > 1) {
                        pages.push(1);
                        if (startPage > 2) pages.push("...");
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }

                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) pages.push("...");
                        pages.push(totalPages);
                      }

                      return pages.map((page, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            typeof page === "number" && changePage(page)
                          }
                          disabled={loadingPage || typeof page !== "number"}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                            currentPage === page
                              ? "bg-purple-600 text-primary"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          } ${typeof page !== "number" ? "cursor-default" : ""}`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages || loadingPage}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #8b4b6b, #d4a574)",
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              <img
                src={Logo}
                alt="StripPals"
                className="w-10 h-10 sm:w-12 sm:h-12"
              />
              <span className="ml-2 text-lg sm:text-xl font-serif font-semibold text-white">
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
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-white/50 text-xs">
              stripPals.com © 2026 All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
