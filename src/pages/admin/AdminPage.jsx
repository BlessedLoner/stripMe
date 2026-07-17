import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import LocationInput from "../../components/LocationInput";

// List of supported countries
const COUNTRIES = [
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" },
  { name: "South Africa", code: "ZA" },
];

// Profile status options (from enum)
const STATUS_OPTIONS = ["active", "inactive", "pending"];

export default function AdminPage() {
  // State
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // NEW: Search state
  const navigate = useNavigate();

  // Likes state
  const [likes, setLikes] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [selectedLikeCountry, setSelectedLikeCountry] = useState("US");
  const [showLikesCountryModal, setShowLikesCountryModal] = useState(false);
  const [showLikesDetailsModal, setShowLikesDetailsModal] = useState(false);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // State Neighbors state
  const [showStateNeighborsModal, setShowStateNeighborsModal] = useState(false);
  const [neighborCountryStates, setNeighborCountryStates] = useState([]);

  const [neighborCountry, setNeighborCountry] = useState("");
  const [neighborState, setNeighborState] = useState("");
  const [neighborStates, setNeighborStates] = useState([]);
  const [selectedNeighbors, setSelectedNeighbors] = useState([]);
  const [searchNeighbor, setSearchNeighbor] = useState("");
  const [savingNeighbors, setSavingNeighbors] = useState(false);

  // Private photos state
  const [privatePhotos, setPrivatePhotos] = useState([]);
  const [privatePhotosInput, setPrivatePhotosInput] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [tempPhotoUrls, setTempPhotoUrls] = useState([]);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    display_name: "",
    name: "",
    age: "",
    gender: "",
    bio: "",
    about: "",
    location_latitude: "",
    location_longitude: "",
    photos: [],
    profile_status: "active",
    state: "",
    image_url: "",
    country: "",
    city: "",
    height: "",
    body_type: "",
    hair_color: "",
    eye_color: "",
    tattoo: false,
    piercing: false,
    smoker: false,
    relationship: "",
    interests: [],
  });

  const [photosInput, setPhotosInput] = useState("");

  // Fetch all profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    async function loadStates() {
      const { data, error } = await supabase
        .from("states")
        .select("*")
        .eq("country_code", formData.country)
        .order("state_name");

      if (!error) {
        setStates(data || []);
      }
    }

    if (formData.country) {
      loadStates();
    } else {
      setStates([]);
    }
  }, [formData.country]);

  useEffect(() => {
    async function loadCities() {
      const selectedState = states.find((s) => s.state_name === formData.state);

      if (!selectedState) return;

      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("state_id", selectedState.id)
        .order("city_name");

      if (!error) {
        setCities(data || []);
      }
    }

    if (formData.state) {
      loadCities();
    } else {
      setCities([]);
    }
  }, [formData.state, states]);

  // Load neighbor states when country changes
  useEffect(() => {
    if (!neighborCountry) {
      setNeighborCountryStates([]);
      return;
    }

    loadNeighborCountryStates();
  }, [neighborCountry]);

  async function loadNeighborCountryStates() {
    const { data } = await supabase
      .from("states")
      .select("*")
      .eq("country_code", neighborCountry)
      .order("state_name");

    setNeighborCountryStates(data || []);
  }

  async function loadNeighborStates() {
    // Load every state in this country
    const { data: allStates, error } = await supabase
      .from("states")
      .select("*")
      .eq("country_code", neighborCountry)
      .order("state_name");

    if (error) {
      console.error(error);
      return;
    }

    // Remove the selected state itself
    const availableStates = neighborCountryStates.filter(
      (state) => state.id !== neighborState,
    );

    setNeighborStates(availableStates);

    // Load existing neighbors
    const { data: existing } = await supabase
      .from("state_neighbors")
      .select("neighbor_state_id")
      .eq("state_id", neighborState);

    setSelectedNeighbors(
      existing ? existing.map((row) => row.neighbor_state_id) : [],
    );
  }

  useEffect(() => {
    if (!neighborState) {
      setNeighborStates([]);
      setSelectedNeighbors([]);
      return;
    }

    loadNeighborStates();
  }, [neighborState]);

  async function saveNeighbors() {
    if (!neighborState) {
      alert("Please select a state.");
      return;
    }

    try {
      setSavingNeighbors(true);

      // Delete current neighbors
      const { error: deleteError } = await supabase
        .from("state_neighbors")
        .delete()
        .eq("state_id", neighborState);

      if (deleteError) throw deleteError;

      if (selectedNeighbors.length > 0) {
        const rows = [];

        for (const neighborId of selectedNeighbors) {
          // Texas -> Oklahoma
          rows.push({
            state_id: neighborState,
            neighbor_state_id: neighborId,
          });

          // Oklahoma -> Texas
          rows.push({
            state_id: neighborId,
            neighbor_state_id: neighborState,
          });
        }

        const uniqueRows = [
          ...new Map(
            rows.map((row) => [
              `${row.state_id}-${row.neighbor_state_id}`,
              row,
            ]),
          ).values(),
        ];

        const { error: insertError } = await supabase
          .from("state_neighbors")
          .upsert(uniqueRows);

        if (insertError) throw insertError;
      }

      setShowStateNeighborsModal(false);

      setNeighborState("");
      setSelectedNeighbors([]);
      setSearchNeighbor("");

      alert("State neighbors saved successfully.");
    } catch (err) {
      console.error("Save neighbors failed:", err);
      alert("Unable to save state neighbors.");
    } finally {
      setSavingNeighbors(false);
    }
  }
  // Not ended yet

  // Load all profiles (including deleted) from Supabase
  async function fetchProfiles() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("fictional_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setError(err.message || "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  // Fetch private photos for a fictional profile
  async function fetchPrivatePhotos(profileId) {
    if (!profileId) return;
    try {
      const { data, error } = await supabase
        .from("fictional_private_photos")
        .select("*")
        .eq("fictional_profile_id", profileId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPrivatePhotos(data || []);

      const urls = (data || []).map((p) => p.image_url);

      setTempPhotoUrls(urls);

      setPrivatePhotosInput(urls.join(", "));
    } catch (err) {
      console.error("Error fetching private photos:", err);
    }
  }

  // Filter profiles: by country + active/deleted status + search query
  const filteredProfiles = profiles.filter((profile) => {
    const countryMatch = profile.country === selectedCountry;
    const statusMatch = showDeleted
      ? profile.is_deleted === true
      : !profile.is_deleted;

    // Search match: check display_name, name, bio, about, city, state
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const displayName = (profile.display_name || "").toLowerCase();
      const name = (profile.name || "").toLowerCase();
      const bio = (profile.bio || "").toLowerCase();
      const about = (profile.about || "").toLowerCase();
      const city = (profile.city || "").toLowerCase();
      const state = (profile.state || "").toLowerCase();

      searchMatch =
        displayName.includes(query) ||
        name.includes(query) ||
        bio.includes(query) ||
        about.includes(query) ||
        city.includes(query) ||
        state.includes(query);
    }

    return countryMatch && statusMatch && searchMatch;
  });

  // Handle form input changes
  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // Handle photos array as comma‑separated string
  function handlePhotosChange(e) {
    const value = e.target.value;
    setPhotosInput(value);
    const arr = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, photos: arr }));
  }

  // Handle private photos input change
  function handlePrivatePhotosChange(e) {
    const value = e.target.value;
    setPrivatePhotosInput(value);
    const urls = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setTempPhotoUrls(urls);
  }

  // Upload a single photo to Supabase Storage
  async function uploadPrivatePhoto(file) {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `private-photos/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("Chat-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("Chat-images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  // Handle file upload for private photos
  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const newUrls = [];
      for (const file of files) {
        const url = await uploadPrivatePhoto(file);
        if (url) newUrls.push(url);
      }

      const allUrls = [...tempPhotoUrls, ...newUrls];
      setTempPhotoUrls(allUrls);
      setPrivatePhotosInput(allUrls.join(", "));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload photos");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Remove a private photo from the list
  function removePrivatePhoto(index) {
    const newUrls = [...tempPhotoUrls];
    newUrls.splice(index, 1);
    setTempPhotoUrls(newUrls);
    setPrivatePhotosInput(newUrls.join(", "));
  }

  // Reset form to empty/default state
  function resetForm() {
    setFormData({
      display_name: "",
      name: "",
      age: "",
      gender: "",
      bio: "",
      about: "",
      location_latitude: "",
      location_longitude: "",
      photos: [],
      profile_status: "active",
      state: "",
      image_url: "",
      country: selectedCountry,
      city: "",
      body_type: "",
      height: "",
      hair_color: "",
      eye_color: "",
      tattoo: false,
      piercing: false,
      smoker: false,
      relationship: "",
      interests: [],
    });
    setPhotosInput("");
    setPrivatePhotos([]);
    setPrivatePhotosInput("");
    setTempPhotoUrls([]);
    setEditingId(null);
  }

  // Open modal for creating a new profile
  function openCreateModal() {
    resetForm();
    setFormData((prev) => ({ ...prev, country: selectedCountry }));
    setModalOpen(true);
  }

  // Open modal for editing an existing profile
  async function openEditModal(profile) {
    setEditingId(profile.id);
    setFormData({
      display_name: profile.display_name || "",
      name: profile.name || "",
      age: profile.age?.toString() || "",
      gender: profile.gender || "",
      bio: profile.bio || "",
      about: profile.about || "",
      location_latitude: profile.location_latitude?.toString() || "",
      location_longitude: profile.location_longitude?.toString() || "",
      photos: profile.photos || [],
      profile_status: profile.profile_status || "active",
      state: profile.state || "",
      image_url: profile.image_url || "",
      country: profile.country || "",
      city: profile.city || "",
      height: profile.height?.toString() || "",
      hair_color: profile.hair_color || "",
      eye_color: profile.eye_color || "",
      tattoo: profile.tattoo || false,
      piercing: profile.piercing || false,
      smoker: profile.smoker || false,
      relationship: profile.relationship || "",
      interests: profile.interests?.join(", ") || "",
      body_type: profile.body_type || "",
    });
    setPhotosInput((profile.photos || []).join(", "));

    // Fetch existing private photos
    await fetchPrivatePhotos(profile.id);

    setModalOpen(true);
  }

  // Close modal
  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  // Save private photos to database
  async function savePrivatePhotos(fictionalProfileId) {
    if (!fictionalProfileId) return;

    // Delete existing private photos
    await supabase
      .from("fictional_private_photos")
      .delete()
      .eq("fictional_profile_id", fictionalProfileId);

    // Insert new private photos
    if (tempPhotoUrls.length > 0) {
      const photoInserts = tempPhotoUrls.map((url, index) => ({
        fictional_profile_id: fictionalProfileId,
        image_url: url,
        display_order: index,
      }));

      const { error } = await supabase
        .from("fictional_private_photos")
        .insert(photoInserts);

      if (error) {
        console.error("Error saving private photos:", error);
      }
    }
  }

  // Create new profile
  async function createProfile() {
    if (!formData.display_name.trim()) {
      setError("Display name is required");
      return;
    }
    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      setError("Age must be a number >= 18");
      return;
    }
    if (!formData.country) {
      setError("Country is required");
      return;
    }

    const interestsArray = formData.interests
      ?.split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const insertData = {
      display_name: formData.display_name.trim(),
      name: formData.name.trim(),
      age: ageNum,
      gender: formData.gender || null,
      bio: formData.bio || null,
      about: formData.about || null,
      location_latitude: formData.location_latitude
        ? parseFloat(formData.location_latitude)
        : null,
      location_longitude: formData.location_longitude
        ? parseFloat(formData.location_longitude)
        : null,
      photos: formData.photos.length ? formData.photos : null,
      profile_status: formData.profile_status,
      state: formData.state || null,
      image_url: formData.image_url || null,
      country: formData.country,
      city: formData.city || null,
      body_type: formData.body_type || null,
      height: formData.height ? parseInt(formData.height, 10) : null,
      hair_color: formData.hair_color || null,
      eye_color: formData.eye_color || null,
      tattoo: formData.tattoo,
      piercing: formData.piercing,
      smoker: formData.smoker,
      relationship: formData.relationship || null,
      interests: interestsArray.length ? interestsArray : null,
      is_deleted: false,
    };

    setActionLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("fictional_profiles")
        .insert([insertData])
        .select();

      if (error) throw error;

      // Save private photos
      if (data && data[0] && tempPhotoUrls.length > 0) {
        await savePrivatePhotos(data[0].id);
      }

      closeModal();
      fetchProfiles();
    } catch (err) {
      console.error("Create error:", err);
      setError(err.message || "Failed to create profile");
    } finally {
      setActionLoading(false);
    }
  }

  // Update existing profile
  async function updateProfile() {
    if (!formData.display_name.trim()) {
      setError("Display name is required");
      return;
    }
    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      setError("Age must be a number >= 18");
      return;
    }
    if (!formData.country) {
      setError("Country is required");
      return;
    }

    const interestsArray = formData.interests
      ?.split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const updateData = {
      display_name: formData.display_name.trim(),
      name: formData.name.trim(),
      age: ageNum,
      gender: formData.gender || null,
      bio: formData.bio || null,
      about: formData.about || null,
      location_latitude: formData.location_latitude
        ? parseFloat(formData.location_latitude)
        : null,
      location_longitude: formData.location_longitude
        ? parseFloat(formData.location_longitude)
        : null,
      photos: formData.photos.length ? formData.photos : null,
      profile_status: formData.profile_status,
      state: formData.state || null,
      image_url: formData.image_url || null,
      country: formData.country,
      city: formData.city || null,
      body_type: formData.body_type || null,
      height: formData.height ? parseInt(formData.height, 10) : null,
      hair_color: formData.hair_color || null,
      eye_color: formData.eye_color || null,
      tattoo: formData.tattoo,
      piercing: formData.piercing,
      smoker: formData.smoker,
      relationship: formData.relationship || null,
      interests: interestsArray.length ? interestsArray : null,
    };

    setActionLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("fictional_profiles")
        .update(updateData)
        .eq("id", editingId);

      if (error) throw error;

      // Save private photos
      await savePrivatePhotos(editingId);

      closeModal();
      fetchProfiles();
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  }

  // Soft delete profile
  async function deleteProfile(id) {
    if (!window.confirm("Are you sure you want to delete this profile?"))
      return;

    setActionLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("fictional_profiles")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) throw error;
      fetchProfiles();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete profile");
    } finally {
      setActionLoading(false);
    }
  }

  // Restore soft deleted profile
  async function restoreProfile(id) {
    if (!window.confirm("Restore this profile to active list?")) return;

    setActionLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("fictional_profiles")
        .update({ is_deleted: false })
        .eq("id", id);

      if (error) throw error;
      fetchProfiles();
    } catch (err) {
      console.error("Restore error:", err);
      setError(err.message || "Failed to restore profile");
    } finally {
      setActionLoading(false);
    }
  }

  // Submit handler
  function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      updateProfile();
    } else {
      createProfile();
    }
  }

  // ---------- Likes functions ----------
  async function fetchLikesForCountry(countryCode) {
    setLikesLoading(true);
    try {
      const { data, error } = await supabase
        .from("likes")
        .select(
          `
  id,
  created_at,
  user_profiles:user_id!inner (
    id,
    display_name
  ),
  fictional_profiles:profile_id!inner (
    id,
    display_name,
    image_url,
    country
  )
`,
        )
        .eq("profile_id.country", countryCode)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLikes(data || []);
    } catch (err) {
      console.error("Error fetching likes:", err);
      setError(err.message);
    } finally {
      setLikesLoading(false);
    }
  }

  function openLikesCountryModal() {
    setShowLikesCountryModal(true);
  }

  async function openLikesDetailsModal(countryCode) {
    setSelectedLikeCountry(countryCode);
    setShowLikesCountryModal(false);
    await fetchLikesForCountry(countryCode);
    setShowLikesDetailsModal(true);
  }

  // ---------- End Likes functions ----------

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
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
                    ? "bg-primary"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {country.name}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 px-4">
              <button
                onClick={() => setShowDeleted(false)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  !showDeleted
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setShowDeleted(true)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  showDeleted
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Deleted
              </button>
            </div>

            <button
              onClick={() => navigate("/members")}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition ml-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Header with Add button and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Admin Panel —{" "}
            {COUNTRIES.find((c) => c.code === selectedCountry)?.name}
            {showDeleted && " (Deleted Profiles)"}
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* NEW: Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2/3 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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

            {!showDeleted && (
              <div className="flex gap-3">
                <button
                  onClick={openLikesCountryModal}
                  className="bg-primary hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200"
                >
                  ❤️ View Likes
                </button>

                <button
                  onClick={() => setShowStateNeighborsModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-black font-semibold py-2 px-4 rounded-lg shadow transition duration-200"
                >
                  🌎 State Neighbors
                </button>

                <button
                  onClick={openCreateModal}
                  className="bg-primary hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200"
                >
                  + Add Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search results count */}
        {searchQuery && (
          <div className="mb-4 text-sm text-gray-600">
            Found {filteredProfiles.length} profile
            {filteredProfiles.length !== 1 ? "s" : ""} matching "{searchQuery}"
          </div>
        )}

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

        {/* Profiles grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProfiles.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {searchQuery
                  ? `No profiles found matching "${searchQuery}"`
                  : showDeleted
                    ? `No deleted profiles for ${COUNTRIES.find((c) => c.code === selectedCountry)?.name}.`
                    : `No active profiles found. Click "Add Profile" to create one.`}
              </div>
            ) : (
              filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg"
                >
                  {profile.image_url && (
                    <img
                      src={profile.image_url}
                      alt={profile.display_name}
                      className="w-full h-48 object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                  <div className="p-5">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {profile.display_name}
                    </h2>
                    <p className="text-gray-600 mb-1">Age: {profile.age}</p>
                    <p className="text-gray-600 mb-1">
                      {profile.city && `${profile.city}, `}
                      {profile.state && `${profile.state}, `}
                      {profile.country}
                    </p>
                    <div className="flex justify-end space-x-3 mt-4">
                      {showDeleted ? (
                        <button
                          onClick={() => restoreProfile(profile.id)}
                          disabled={actionLoading}
                          className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-black rounded transition disabled:opacity-50"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(profile)}
                            disabled={actionLoading}
                            className="px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-black rounded transition disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProfile(profile.id)}
                            disabled={actionLoading}
                            className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-black rounded transition disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit with Private Photos */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Profile" : "Create New Profile"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info - Same as before */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                      min="18"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <input
                      type="text"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="profile_status"
                      value={formData.profile_status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows="2"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    About
                  </label>
                  <textarea
                    name="about"
                    rows="3"
                    value={formData.about}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location */}
                <div className="space-y-4">
                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>

                    <select
                      name="country"
                      value={formData.country}
                      onChange={(e) => {
                        handleInputChange(e);

                        setFormData((prev) => ({
                          ...prev,
                          state: "",
                          city: "",
                          location_latitude: "",
                          location_longitude: "",
                        }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select country</option>

                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State */}
                  {formData.country && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>

                      <select
                        value={formData.state || ""}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            state: e.target.value,
                            city: "",
                            location_latitude: "",
                            location_longitude: "",
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select state</option>

                        {states.map((state) => (
                          <option key={state.id} value={state.state_name}>
                            {state.state_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* City */}
                  {formData.state && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>

                      <select
                        value={formData.city || ""}
                        onChange={(e) => {
                          const selectedCity = cities.find(
                            (c) => c.id === e.target.value,
                          );

                          setFormData((prev) => ({
                            ...prev,

                            // save REAL city name
                            city: selectedCity?.city_name || "",

                            // save lat/lng
                            location_latitude: selectedCity?.latitude || "",

                            location_longitude: selectedCity?.longitude || "",
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select city</option>

                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.city_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>

                      <input
                        type="text"
                        value={formData.state || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>

                      <input
                        type="text"
                        value={formData.city || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>

                      <input
                        type="text"
                        value={formData.location_latitude || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>

                      <input
                        type="text"
                        value={formData.location_longitude || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}

                {/* Appearance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Type
                    </label>
                    <input
                      type="text"
                      name="body_type"
                      value={formData.body_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    name="height"
                    value={formData.height || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select height</option>

                    {Array.from({ length: 31 }, (_, i) => {
                      const totalInches = i + 60; // 5'0 = 60 inches

                      const feet = Math.floor(totalInches / 12);
                      const inches = totalInches % 12;

                      return (
                        <option key={totalInches} value={totalInches}>
                          {feet}' {inches}"
                        </option>
                      );
                    })}
                  </select>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hair Color
                    </label>
                    <input
                      type="text"
                      name="hair_color"
                      value={formData.hair_color}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Eye Color
                    </label>
                    <input
                      type="text"
                      name="eye_color"
                      value={formData.eye_color}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Lifestyle */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="tattoo"
                      checked={formData.tattoo}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Tattoo</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="piercing"
                      checked={formData.piercing}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Piercing</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="smoker"
                      checked={formData.smoker}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Smoker</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Profile Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Additional Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Photos (comma‑separated URLs)
                  </label>
                  <input
                    type="text"
                    value={photosInput}
                    onChange={handlePhotosChange}
                    placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple URLs with commas.
                  </p>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interests (comma‑separated)
                  </label>
                  <input
                    type="text"
                    name="interests"
                    value={formData.interests}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple interests with commas.
                  </p>
                </div>

                {/* ========== NEW: PRIVATE PHOTOS SECTION ========== */}
                <div className="border-t border-gray-400 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Private Photos (for operator gallery)
                  </label>

                  {/* File upload button */}
                  <div className="mb-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="px-4 py-2 bg-green-500 text-black rounded-md hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {uploadingPhoto ? "Uploading..." : "📷 Upload Images"}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload images that operators can send to users. Supports
                      JPG, PNG, GIF.
                    </p>
                  </div>

                  {/* URL input alternative */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 mb-1">
                      Or enter image URLs (comma‑separated)
                    </label>
                    <textarea
                      value={privatePhotosInput}
                      onChange={handlePrivatePhotosChange}
                      placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Preview of private photos */}
                  {tempPhotoUrls.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Photo Preview ({tempPhotoUrls.length} images)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {tempPhotoUrls.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={url}
                              alt={`Private photo ${idx + 1}`}
                              className="w-full h-20 object-cover rounded-md border border-gray-200"
                              onError={(e) => {
                                e.target.src =
                                  "https://placehold.co/100x100?text=Invalid+URL";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removePrivatePhoto(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-primary hover:bg-blue-700 text-black rounded-md transition disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Saving..."
                      : editingId
                        ? "Update"
                        : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Country selection for Likes */}
      {showLikesCountryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Select Country to View Likes
              </h3>
              <button
                onClick={() => setShowLikesCountryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => openLikesDetailsModal(country.code)}
                    className="bg-gray-50 rounded-lg shadow p-4 text-center hover:shadow-lg transition hover:bg-gray-100"
                  >
                    <h3 className="font-semibold text-gray-800">
                      {country.name}
                    </h3>
                    <p className="text-2xl font-bold text-primary mt-2">📊</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to view likes
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button
                onClick={() => setShowLikesCountryModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: State Neighbors */}
      {showStateNeighborsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                🌎 Configure State Neighbors
              </h2>

              <button
                onClick={() => setShowStateNeighborsModal(false)}
                className="text-gray-500 hover:text-red-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Country */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Country</label>

              <select
                value={neighborCountry}
                onChange={(e) => {
                  setNeighborCountry(e.target.value);
                  setNeighborState("");
                  setSearchNeighbor("");
                }}
                className="w-full border rounded-lg p-3"
              >
                <option value="">Select Country</option>

                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            {neighborCountry && (
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">State</label>

                <select
                  value={neighborState}
                  onChange={(e) => setNeighborState(e.target.value)}
                  className="w-full border rounded-lg p-3"
                >
                  <option value="">Select State</option>

                  {neighborCountryStates.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.state_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search */}
            {neighborState && (
              <div className="mb-5">
                <input
                  type="text"
                  placeholder="Search state..."
                  value={searchNeighbor}
                  onChange={(e) => setSearchNeighbor(e.target.value)}
                  className="w-full border rounded-lg p-3"
                />
              </div>
            )}

            {/* Checkbox List */}

            {neighborState && (
              <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                {neighborStates
                  .filter((state) =>
                    state.state_name
                      .toLowerCase()
                      .includes(searchNeighbor.toLowerCase()),
                  )
                  .map((state) => (
                    <label
                      key={state.id}
                      className="flex items-center gap-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNeighbors.includes(state.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNeighbors((prev) => [...prev, state.id]);
                          } else {
                            setSelectedNeighbors((prev) =>
                              prev.filter((id) => id !== state.id),
                            );
                          }
                        }}
                      />

                      {state.state_name}
                    </label>
                  ))}
              </div>
            )}

            {/* Footer */}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStateNeighborsModal(false)}
                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={saveNeighbors}
                disabled={savingNeighbors}
                className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-blue-700"
              >
                {savingNeighbors ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Actual likes for a specific country */}
      {showLikesDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Likes for{" "}
                {COUNTRIES.find((c) => c.code === selectedLikeCountry)?.name}
              </h3>
              <button
                onClick={() => setShowLikesDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {likesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : likes.length === 0 ? (
                <p className="text-center text-gray-500 py-12">
                  No likes yet for this country.
                </p>
              ) : (
                likes.map((like) => (
                  <div
                    key={like.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {like.user_profiles?.display_name || "Unknown user"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Liked:{" "}
                          <span className="font-medium">
                            {like.fictional_profiles?.display_name}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(like.created_at).toLocaleString()}
                        </p>
                      </div>
                      {like.fictional_profiles?.image_url && (
                        <img
                          src={like.fictional_profiles.image_url}
                          alt={like.fictional_profiles.display_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button
                onClick={() => setShowLikesDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
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
