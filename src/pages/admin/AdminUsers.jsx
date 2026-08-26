import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

// List of supported countries
const COUNTRIES = [
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" },
  { name: "South Africa", code: "ZA" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [userCredits, setUserCredits] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const navigate = useNavigate();

  // Fetch users with pagination, search, and country filter
  async function fetchUsers(page = 1, search = "") {
    setLoading(true);
    setError(null);

    try {
      // Build the query for user_profiles
      let query = supabase
        .from("user_profiles")
        .select("*", { count: "exact" })
        .eq("country", selectedCountry)
        .order("created_at", { ascending: false });

      // Apply search if provided
      if (search && search.trim().length >= 2) {
        const term = search.trim();
        query = query.or(
          `display_name.ilike.%${term}%,bio.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`,
        );
        const { data, error, count } = await query;
        if (error) throw error;

        setUsers(data || []);
        setTotalCount(count || 0);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      // Paginate non-search queries
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / limit));
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // Fetch credits for a user
  async function fetchUserCredits(profileId) {
    if (!profileId) return null;

    try {
      console.log("💳 Fetching credits for profile:", profileId);

      const { data, error } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", profileId)
        .maybeSingle();

      console.log("💳 ADMIN CREDIT RESULT:", {
        profileId,
        data,
        error,
      });

      if (error) {
        console.error("Error fetching credits:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Error fetching credits:", err);
      return null;
    }
  }

  // Load blocked users
  async function fetchBlockedUsers() {
    try {
      const { data, error } = await supabase
        .from("blocked_profiles")
        .select("user_profile_id, blocked_fictional_id");

      if (!error) {
        setBlockedUsers(data || []);
      }
    } catch (err) {
      console.error("Error fetching blocked users:", err);
    }
  }

  // Check if a user is blocked
  function isUserBlocked(userId) {
    return blockedUsers.some((block) => block.user_profile_id === userId);
  }

  // Block a user - FIXED
  async function blockUser(userId) {
    if (
      !window.confirm(
        `Are you sure you want to block this user? They won't be able to message any fictional profiles.`,
      )
    )
      return;

    setActionLoading(true);
    try {
      // Get all fictional profiles to block
      const { data: fictionalProfiles, error: fetchError } = await supabase
        .from("fictional_profiles")
        .select("id")
        .eq("is_deleted", false);

      if (fetchError) throw fetchError;

      if (fictionalProfiles && fictionalProfiles.length > 0) {
        // ✅ FIX: Use upsert with proper conflict handling
        const blocks = fictionalProfiles.map((fp) => ({
          user_profile_id: userId,
          blocked_fictional_id: fp.id,
        }));

        // Delete existing blocks first to avoid conflicts
        const { error: deleteError } = await supabase
          .from("blocked_profiles")
          .delete()
          .eq("user_profile_id", userId);

        if (deleteError) {
          console.error("Delete error:", deleteError);
        }

        // Insert new blocks
        const { error: insertError } = await supabase
          .from("blocked_profiles")
          .insert(blocks);

        if (insertError) {
          // If insert fails, try upsert as fallback
          const { error: upsertError } = await supabase
            .from("blocked_profiles")
            .upsert(blocks, {
              onConflict: "user_profile_id, blocked_fictional_id",
            });

          if (upsertError) throw upsertError;
        }
      }

      await fetchBlockedUsers();
      alert("✅ User blocked successfully!");
    } catch (err) {
      console.error("Error blocking user:", err);
      alert("❌ Failed to block user: " + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Unblock a user
  async function unblockUser(userId) {
    if (!window.confirm(`Are you sure you want to unblock this user?`)) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("blocked_profiles")
        .delete()
        .eq("user_profile_id", userId);

      if (error) throw error;

      await fetchBlockedUsers();
      alert("✅ User unblocked successfully!");
    } catch (err) {
      console.error("Error unblocking user:", err);
      alert("❌ Failed to unblock user: " + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Suspend a user (by updating their role)
  async function suspendUser(userId, currentRole) {
    const action = currentRole === "suspended" ? "unsuspend" : "suspend";
    const confirmMsg =
      action === "suspend"
        ? "Are you sure you want to SUSPEND this user? They won't be able to log in or use the app."
        : "Are you sure you want to UNSUSPEND this user?";

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const newRole = action === "suspend" ? "suspended" : "user";

      const { error } = await supabase
        .from("user_profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      // Update the user in the list
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );

      // If modal is open, update selected user
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => ({ ...prev, role: newRole }));
      }

      alert(
        `✅ User ${action === "suspend" ? "suspended" : "unsuspended"} successfully!`,
      );
    } catch (err) {
      console.error("Error suspending user:", err);
      alert("❌ Failed to " + action + " user: " + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Open user details modal
  async function openUserModal(user) {
    setSelectedUser(user);
    setShowUserModal(true);

    // credits.user_id references user_profiles.id
    const credits = await fetchUserCredits(user.id);

    if (credits) {
      setUserCredits((prev) => ({
        ...prev,
        [user.id]: credits,
      }));
    }
  }

  // Close modal
  function closeModal() {
    setShowUserModal(false);
    setSelectedUser(null);
  }

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2 || searchQuery === "") {
        const page = searchQuery.trim().length >= 2 ? 1 : currentPage;
        fetchUsers(page, searchQuery);
        if (searchQuery.trim().length >= 2) {
          setCurrentPage(1);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCountry]);

  // Initial fetch
  useEffect(() => {
    fetchUsers(1, "");
    fetchBlockedUsers();
  }, []);

  // Refetch when country changes
  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(1, searchQuery);
  }, [selectedCountry]);

  // Format date
  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Render user details in modal
  function renderUserDetails() {
    if (!selectedUser) return null;

    const isBlocked = isUserBlocked(selectedUser.user_id);
    const isSuspended = selectedUser.role === "suspended";
    const credits = userCredits[selectedUser.id];

    return (
      <div className="space-y-6">
        {/* Header with avatar and basic info */}
        <div className="flex items-start gap-4">
          {selectedUser.profile_img ? (
            <img
              src={selectedUser.profile_img}
              alt={selectedUser.display_name}
              className="w-20 h-20 rounded-full object-cover border-4 border-primary"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
              {selectedUser.display_name?.charAt(0) || "U"}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedUser.display_name}
            </h2>
            <p className="text-gray-500">
              {selectedUser.email || "No email found"}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                Age: {selectedUser.age || "N/A"}
              </span>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                {selectedUser.gender || "No gender"}
              </span>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  isSuspended
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {selectedUser.role || "user"}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 space-y-2">
            {isBlocked ? (
              <button
                onClick={() => unblockUser(selectedUser.user_id)}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-primary hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50 text-sm"
              >
                Unblock User
              </button>
            ) : (
              <button
                onClick={() => blockUser(selectedUser.user_id)}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-primary hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 text-sm"
              >
                Block User
              </button>
            )}
            <button
              onClick={() => suspendUser(selectedUser.id, selectedUser.role)}
              disabled={actionLoading}
              className={`w-full px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm ${
                isSuspended
                  ? "bg-primary hover:bg-green-600 text-white"
                  : "bg-primary hover:bg-yellow-600 text-white"
              }`}
            >
              {isSuspended ? "Unsuspend User" : "Suspend User"}
            </button>
          </div>
        </div>

        {/* Credits Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            💰 Credits
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {credits?.balance || 0}
              </p>
              <p className="text-xs text-gray-500">Balance</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {credits?.total_purchased || 0}
              </p>
              <p className="text-xs text-gray-500">Total Purchased</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {credits?.total_used || 0}
              </p>
              <p className="text-xs text-gray-500">Total Used</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        {selectedUser.bio && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Bio</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
              {selectedUser.bio}
            </p>
          </div>
        )}

        {/* Location */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Country</span>
              <p className="font-medium">{selectedUser.country || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">State</span>
              <p className="font-medium">{selectedUser.state || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">City</span>
              <p className="font-medium">{selectedUser.city || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Member Since</span>
              <p className="font-medium">
                {formatDate(selectedUser.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Appearance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Height</span>
              <p className="font-medium">{selectedUser.height || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Body Type</span>
              <p className="font-medium">{selectedUser.body_type || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Hair Color</span>
              <p className="font-medium">{selectedUser.hair_color || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Eye Color</span>
              <p className="font-medium">{selectedUser.eye_color || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Preferences
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Looking For</span>
              <p className="font-medium">
                {selectedUser.looking_gender || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Marital Status</span>
              <p className="font-medium">
                {selectedUser.marital_status || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Age Range</span>
              <p className="font-medium">
                {selectedUser.min_age_preference} -{" "}
                {selectedUser.max_age_preference}
              </p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <span className="text-xs text-gray-500">Max Distance</span>
              <p className="font-medium">
                {selectedUser.max_distance_km || 50} km
              </p>
            </div>
          </div>
        </div>

        {/* Interests */}
        {selectedUser.interests && selectedUser.interests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(selectedUser.interests) ? (
                selectedUser.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No interests listed</p>
              )}
            </div>
          </div>
        )}

        {/* Relationship Goals */}
        {selectedUser.relationship_goals &&
          selectedUser.relationship_goals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Relationship Goals
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(selectedUser.relationship_goals) ? (
                  selectedUser.relationship_goals.map((goal, idx) => (
                    <span
                      key={idx}
                      className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      {goal}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No goals listed</p>
                )}
              </div>
            </div>
          )}

        {/* Lifestyle */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Lifestyle
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 p-2 rounded-lg text-center">
              <span className="text-xs text-gray-500">Smoker</span>
              <p className="font-medium">{selectedUser.smoker || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg text-center">
              <span className="text-xs text-gray-500">Tattoo</span>
              <p className="font-medium">{selectedUser.tattoo || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg text-center">
              <span className="text-xs text-gray-500">Piercing</span>
              <p className="font-medium">{selectedUser.piercing || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Transportation */}
        {selectedUser.transportation && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Transportation
            </h3>
            <p className="text-gray-600">{selectedUser.transportation}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Country Header */}
        <div className="bg-white rounded-lg shadow mb-8 overflow-x-auto">
          <div className="flex flex-wrap items-center">
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country.code)}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  selectedCountry === country.code
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {country.name}
              </button>
            ))}
            <div className="ml-auto px-4">
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <span>←</span> Back to Profiles
              </button>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            👥 Users — {COUNTRIES.find((c) => c.code === selectedCountry)?.name}
          </h1>
          <div className="w-full sm:w-64">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Users grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {searchQuery
                  ? `No users found matching "${searchQuery}"`
                  : `No users found for ${COUNTRIES.find((c) => c.code === selectedCountry)?.name}.`}
              </div>
            ) : (
              users.map((user) => {
                const isBlocked = isUserBlocked(user.user_id);
                const isSuspended = user.role === "suspended";
                return (
                  <div
                    key={user.id}
                    onClick={() => openUserModal(user)}
                    className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg ${
                      isSuspended ? "opacity-60 border-2 border-red-300" : ""
                    }`}
                  >
                    {user.profile_img ? (
                      <img
                        src={user.profile_img}
                        alt={user.display_name}
                        className="w-full h-48 object-cover"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <div className="w-full h-48 bg-primary/10 flex items-center justify-center text-6xl text-primary/30">
                        {user.display_name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <h2 className="text-xl font-semibold text-gray-800 mb-1">
                          {user.display_name}
                        </h2>
                        <div className="flex gap-1">
                          {isBlocked && (
                            <span className="text-xs bg-primary text-red-600 px-2 py-1 rounded-full">
                              Blocked
                            </span>
                          )}
                          {isSuspended && (
                            <span className="text-xs bg-primary text-orange-600 px-2 py-1 rounded-full">
                              Suspended
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm">
                        {user.email || "No email"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                        {user.age && <span>{user.age} yrs</span>}
                        {user.gender && <span>• {user.gender}</span>}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {user.city && `${user.city}, `}
                        {user.state && `${user.state}, `}
                        {user.country}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openUserModal(user);
                          }}
                          className="flex-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !searchQuery && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                fetchUsers(currentPage - 1, searchQuery);
              }}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                let pageNum;
                if (totalPages <= 10) {
                  pageNum = i + 1;
                } else if (currentPage <= 6) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 5) {
                  pageNum = totalPages - 9 + i;
                } else {
                  pageNum = currentPage - 5 + i;
                }

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      fetchUsers(pageNum, searchQuery);
                    }}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                      currentPage === pageNum
                        ? "bg-primary text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                fetchUsers(currentPage + 1, searchQuery);
              }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Show total count */}
        {!loading && (
          <div className="text-center text-sm text-gray-500 mt-4">
            {searchQuery
              ? `Found ${totalCount} user${totalCount !== 1 ? "s" : ""} matching "${searchQuery}"`
              : `Showing ${users.length} of ${totalCount} users`}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">{renderUserDetails()}</div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
