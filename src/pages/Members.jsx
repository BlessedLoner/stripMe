// *************************MembersPage.jsx*************************
// src/components/MembersFromDB.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import LoveButton from "../components/LoveButton";
import sexy_pic from "../assets/sexy_pic.jpg";
import newhome2 from "../assets/home_img/newhome2.jpg";
import Logo from "../assets/Logo.png";
import { REGIONS } from "../data/regions";

const FILTERS_STORAGE_KEY = "members_filters";

export default function MembersFromDB({ limit = 200 }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial filter values from URL
  const queryParams = new URLSearchParams(location.search);

  // Save filters to localStorage
  const saveFiltersToStorage = (filtersData) => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersData));
    } catch (e) {
      console.error("Failed to save filters:", e);
    }
  };

  // Load filters from localStorage
  const loadFiltersFromStorage = () => {
    try {
      const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load filters:", e);
    }
    return null;
  };

  // Get initial filters from URL or localStorage
  const getInitialFilters = () => {
    const hasUrlParams =
      queryParams.get("minAge") ||
      queryParams.get("maxAge") ||
      queryParams.get("distance") ||
      queryParams.get("lookingFor") ||
      queryParams.get("state") ||
      queryParams.get("search");

    if (hasUrlParams) {
      return {
        minAge: parseInt(queryParams.get("minAge")) || 18,
        maxAge: parseInt(queryParams.get("maxAge")) || 90,
        distance: queryParams.get("distance") || "50",
        lookingFor: queryParams.get("lookingFor") || "",
        state: queryParams.get("state") || "",
        searchQuery: queryParams.get("search") || "",
      };
    }

    const stored = loadFiltersFromStorage();
    if (stored) {
      return {
        minAge: stored.minAge || 18,
        maxAge: stored.maxAge || 90,
        distance: stored.distance || "50",
        lookingFor: stored.lookingFor || "",
        state: stored.state || "",
        searchQuery: stored.searchQuery || "",
      };
    }

    return {
      minAge: 18,
      maxAge: 90,
      distance: "50",
      lookingFor: "",
      state: "",
      searchQuery: "",
    };
  };

  const getInitialPage = () => {
    const urlPage = parseInt(queryParams.get("page"));
    if (urlPage) return urlPage;

    const stored = loadFiltersFromStorage();
    if (stored && stored.page) {
      return stored.page;
    }
    return 1;
  };

  const [filters, setFilters] = useState(getInitialFilters);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileId, setUserProfileId] = useState(null);
  const [toast, setToast] = useState(null);

  const [regions, setRegions] = useState([]);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [neighborStates, setNeighborStates] = useState([]);

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [loadingPage, setLoadingPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [windowStart, setWindowStart] = useState(1);
  const membersPerPage = 20;

  const totalPages = Math.ceil(totalCount / membersPerPage);

  // Update URL when filters change
  const updateURL = (newFilters, page = currentPage) => {
    const params = new URLSearchParams();

    if (newFilters.minAge && newFilters.minAge !== 18) {
      params.set("minAge", newFilters.minAge);
    }
    if (newFilters.maxAge && newFilters.maxAge !== 90) {
      params.set("maxAge", newFilters.maxAge);
    }
    if (newFilters.distance && newFilters.distance !== "50") {
      params.set("distance", newFilters.distance);
    }
    if (newFilters.lookingFor) {
      params.set("lookingFor", newFilters.lookingFor);
    }
    if (newFilters.state) {
      params.set("state", newFilters.state);
    }
    if (newFilters.searchQuery) {
      params.set("search", newFilters.searchQuery);
    }
    if (page && page > 1) {
      params.set("page", page);
    }

    const searchString = params.toString();
    const newURL = searchString ? `?${searchString}` : location.pathname;

    navigate(newURL, { replace: true });

    saveFiltersToStorage({
      ...newFilters,
      page: page,
    });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  };

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    const windowSize = 7;
    let newStart = Math.max(1, page - 3);
    if (newStart + windowSize - 1 > totalPages) {
      newStart = Math.max(1, totalPages - windowSize + 1);
    }
    setWindowStart(newStart);

    updateURL(filters, page);

    window.scrollTo({ top: 0, behavior: "smooth" });
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

      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setUserProfileId(data.id);

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
    if (!filters.state || !currentUser?.country) {
      setNeighborStates([]);
      return;
    }

    async function loadNeighbors() {
      const { data, error } = await supabase
        .from("state_neighbors")
        .select("*")
        .eq("state_name", filters.state)
        .eq("country_code", currentUser.country);

      if (error) {
        console.error("Failed loading neighbors:", error);
        return;
      }

      setNeighborStates(data.map((item) => item) || []);
    }

    loadNeighbors();
  }, [filters.state, currentUser?.country]);

  useEffect(() => {
    if (!currentUser) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    async function fetchFiltered() {
      try {
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

        const { data, count, error: qErr } = await q;

        if (!mounted) return;
        if (qErr) throw qErr;

        let results = Array.isArray(data) ? data : [];
        setTotalCount(count || 0);

        const normalize = (v) => v?.toLowerCase()?.trim();
        const userState = normalize(currentUser.state);
        const userCity = normalize(currentUser.city);
        const selectedState = normalize(filters.state);

        const getPriority = (profile) => {
          const profileState = normalize(profile.state);
          const profileCity = normalize(profile.city);

          if (!selectedState) {
            if (profileCity === userCity) return 1;
            if (profileState === userState) return 2;
            return 3;
          }

          if (profileState === selectedState) return 1;
          if (neighborStates.includes(profileState)) return 2;
          return 3;
        };

        results.sort((a, b) => {
          const priorityDiff = getPriority(a) - getPriority(b);
          if (priorityDiff !== 0) return priorityDiff;
          return (a.shuffle_order || 999999) - (b.shuffle_order || 999999);
        });

        if (selectedState) {
          const hasProfilesInSelectedState = results.some(
            (profile) => normalize(profile.state) === selectedState,
          );
          setShowFallbackMessage(!hasProfilesInSelectedState);
          setSelectedState(filters.state);
        } else {
          setShowFallbackMessage(false);
        }

        setAllMembers(results);
        setTotalCount(results.length);
        setHasLoadedOnce(true);
      } catch (err) {
        if (mounted) {
          setError(err);
          setAllMembers([]);
          setFilteredMembers([]);
          setHasLoadedOnce(true);
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
    neighborStates,
  ]);

  // Paginate locally so changing pages is instant and never refetches Supabase.
  useEffect(() => {
    const from = (currentPage - 1) * membersPerPage;
    const to = from + membersPerPage;
    setFilteredMembers(allMembers.slice(from, to));
  }, [allMembers, currentPage]);

  useEffect(() => {
    const windowSize = 7;
    const start = Math.max(1, currentPage - 3);
    const end = Math.min(totalPages, start + windowSize - 1);

    if (
      currentPage < windowStart ||
      currentPage > windowStart + windowSize - 1
    ) {
      let newStart = Math.max(1, currentPage - 3);
      if (newStart + windowSize - 1 > totalPages) {
        newStart = Math.max(1, totalPages - windowSize + 1);
      }
      setWindowStart(newStart);
    }
  }, [currentPage, totalPages]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const activeFilterCount = [
    filters.searchQuery,
    filters.state,
    filters.lookingFor,
    filters.minAge !== 18 ? filters.minAge : null,
    filters.maxAge !== 90 ? filters.maxAge : null,
  ].filter(Boolean).length;

  const resetFilters = () => {
    const defaults = {
      minAge: 18,
      maxAge: 90,
      distance: "50",
      lookingFor: "",
      state: "",
      searchQuery: "",
    };
    setFilters(defaults);
    setCurrentPage(1);
    updateURL(defaults, 1);
  };

  return (
    <div className="pt-16 min-h-screen bg-[#fffafc] text-gray-900">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm">
          <div className="bg-gray-950/95 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-2xl text-sm text-center animate-fadeIn">
            {toast}
          </div>
        </div>
      )}

      {/* Search / discovery hero */}
      <section className="relative overflow-hidden border-b border-rose-100 bg-white">
        <div className="absolute inset-0 z-0">
          <img
            src={newhome2}
            alt="Happy couple connecting"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
            }}
          />
          {/* dark gradient overlay */}
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-semibold text-[#8b4b6b] mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Discover people near you
              </div>
            </div>
          </div>

          <div className="rounded-3xl border backdrop-blur p-3 sm:p-4 shadow-[0_18px_55px_rgba(80,30,55,0.08)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[11px] uppercase tracking-[0.14em] font-bold text-gray-100 mb-1.5 ml-1">
                  Search members 🔎
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Name or interests..."
                    className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#8b4b6b]/30 focus:ring-4 focus:ring-[#8b4b6b]/10 transition"
                    value={filters.searchQuery}
                    onChange={(e) =>
                      handleFilterChange("searchQuery", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[11px] uppercase tracking-[0.14em] font-bold text-gray-100 mb-1.5 ml-1">
                  Age
                </label>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <select
                    className="h-12 w-full bg-gray-50 border border-transparent rounded-2xl px-3 outline-none focus:bg-white focus:border-[#8b4b6b]/30 transition"
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
                  <span className="text-gray-100 text-sm">—</span>
                  <select
                    className="h-12 w-full bg-gray-50 border border-transparent rounded-2xl px-3 outline-none focus:bg-white focus:border-[#8b4b6b]/30 transition"
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

              <div className="lg:col-span-3">
                <label className="block text-[11px] uppercase tracking-[0.14em] font-bold text-gray-100 mb-1.5 ml-1">
                  Looking for
                </label>
                <select
                  className="h-12 w-full bg-gray-50 border border-transparent rounded-2xl px-4 outline-none focus:bg-white focus:border-[#8b4b6b]/30 transition"
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

              <div className="lg:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.14em] font-bold text-gray-100 mb-1.5 ml-1">
                  Location
                </label>
                <select
                  className="h-12 w-full bg-gray-50 border border-transparent rounded-2xl px-4 outline-none focus:bg-white focus:border-[#8b4b6b]/30 transition"
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
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-7 sm:py-10">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Members for you</h2>
          </div>
        </div>

        {loading && !hasLoadedOnce ? (
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
            aria-label="Loading members"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[22px] sm:rounded-[28px] border border-gray-200/70 bg-white shadow-[0_8px_30px_rgba(50,20,35,0.05)]"
              >
                <div className="aspect-[4/5] bg-gray-200 animate-pulse" />
                <div className="p-3 sm:p-4">
                  <div className="h-3 sm:h-4 w-4/5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="mt-2 h-3 w-3/5 rounded-full bg-gray-100 animate-pulse" />
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-9 sm:h-11 flex-1 rounded-xl sm:rounded-2xl bg-gray-200 animate-pulse" />
                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gray-100 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 rounded-3xl bg-white border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              ♡
            </div>
            <h3 className="text-xl font-bold">No matches found</h3>
            <p className="text-gray-500 mt-2">
              Try adjusting your filters to discover more members.
            </p>
            <button
              onClick={resetFilters}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gray-950 text-white text-sm font-semibold"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            {showFallbackMessage && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-amber-950">
                    No members available in {selectedState} yet
                  </h3>
                  <p className="mt-1 text-sm text-amber-800/80">
                    We're growing every day. For now, we're showing people from
                    nearby regions you may also like.
                  </p>
                  {neighborStates.length > 0 && (
                    <p className="mt-1 text-xs font-semibold text-amber-900">
                      Nearby: {neighborStates.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
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
                  <article
                    key={m.id}
                    className="group relative bg-white rounded-[22px] sm:rounded-[28px] overflow-hidden border border-gray-200/70 shadow-[0_8px_30px_rgba(50,20,35,0.06)] hover:shadow-[0_18px_45px_rgba(80,30,55,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <button
                      onClick={() =>
                        navigate(`/profile/${m.id}`, { state: { member: m } })
                      }
                      className="relative block w-full aspect-[4/5] overflow-hidden bg-gray-100 text-left"
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={m.display_name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 inline-flex items-center gap-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold text-white shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                        ONLINE
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-base sm:text-xl font-bold truncate drop-shadow">
                            {m.display_name}
                          </h3>
                          {m.age && (
                            <span className="text-sm sm:text-base font-medium opacity-90">
                              {m.age}
                            </span>
                          )}
                        </div>
                        {(m.city || m.state) && (
                          <p className="mt-0.5 text-[10px] sm:text-xs text-white/85 truncate">
                            📍 {[m.city, m.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <p className="text-gray-500 text-[11px] sm:text-sm leading-relaxed line-clamp-2 min-h-[2.5em]">
                        {m.bio ||
                          "Say hello and discover more about this member."}
                      </p>
                      <div className="flex items-center gap-2 mt-3 sm:mt-4">
                        <button
                          onClick={() =>
                            navigate(`/profile/${m.id}`, {
                              state: { member: m },
                            })
                          }
                          className="flex-1 h-9 sm:h-11 flex items-center justify-center gap-2 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                          style={{
                            backgroundImage:
                              "linear-gradient(110deg, #7d3f61, #a95f78 52%, #d4a574)",
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
                        <div className="shrink-0">
                          <LoveButton
                            showToast={showToast}
                            fictionalProfileId={m.id}
                            userProfileId={userProfileId}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasLoadedOnce && filteredMembers.length === 0 && (
              <div className="text-center py-16 rounded-3xl bg-white border border-gray-100">
                <div className="text-4xl mb-3">♡</div>
                <h3 className="font-bold text-lg">Nothing here yet</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Try a broader search or clear your filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-gray-950 text-white text-sm font-semibold"
                >
                  Clear filters
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <nav
                className="flex justify-center items-center gap-2 mt-10 sm:mt-14"
                aria-label="Pagination"
              >
                <button
                  aria-label="Previous page"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:border-[#8b4b6b]/40 hover:text-[#8b4b6b] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="flex items-center gap-1 bg-white border border-gray-200 shadow-sm rounded-2xl p-1 overflow-x-auto max-w-[70vw]">
                  {(() => {
                    const pages = [];
                    const total = totalPages;
                    const current = currentPage;
                    const windowSize =
                      typeof window !== "undefined" && window.innerWidth < 640
                        ? 5
                        : 7;
                    let start = Math.max(1, current - 3);
                    let end = Math.min(total, start + windowSize - 1);
                    if (end - start < windowSize - 1)
                      start = Math.max(1, end - windowSize + 1);
                    if (total <= windowSize) {
                      start = 1;
                      end = total;
                    }
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages;
                  })().map((page) => (
                    <button
                      key={page}
                      onClick={() => changePage(page)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page ? "text-white shadow-md scale-105" : "text-gray-500 hover:bg-gray-100"}`}
                      style={
                        currentPage === page
                          ? {
                              backgroundImage:
                                "linear-gradient(135deg, #8b4b6b, #d4a574)",
                            }
                          : undefined
                      }
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  aria-label="Next page"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:border-[#8b4b6b]/40 hover:text-[#8b4b6b] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      <footer className="mt-8 bg-text-primary text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center mb-7">
            <img
              src={Logo}
              alt="StripPals"
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <span className="ml-2 text-xl font-serif font-semibold">
              StripPals
            </span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-3 text-xs sm:text-sm text-white/60 mb-8">
            <Link to="/protect" className="hover:text-white transition">
              Protect our children!
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/terms" className="hover:text-white transition">
              Terms of use
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/cookies" className="hover:text-white transition">
              Cookies
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/complaint" className="hover:text-white transition">
              Complaint policy
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/2257" className="hover:text-white transition">
              2257
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/dmca" className="hover:text-white transition">
              DMCA
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/pricing" className="hover:text-white transition">
              Pricing
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-white/40 text-xs">
              stripPals.com © 2026 All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
