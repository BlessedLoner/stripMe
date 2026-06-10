// AccountSettings.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { supabase } from "../lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import ImageModal from "../components/ImageModel";
import DefaultAvatar from "../assets/default-avatar-male.svg";
import { LoveSpinner } from "../components/Spinner";

export default function AccountSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [showMobileContent, setShowMobileContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [sentImages, setSentImages] = useState([]);
  const fileInputRef = useRef(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [provider, setProvider] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showInterests, setShowInterests] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);
  const [showLookingFor, setShowLookingFor] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [reports, setReports] = useState([]);

  const [showBlocked, setShowBlocked] = useState(false);
  const [showReports, setShowReports] = useState(false);

  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  // In AccountSettings component, add:
  const [authUserId, setAuthUserId] = useState(null);
  const [userProfileId, setUserProfileId] = useState(null);

  // Add these with your other useState declarations
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [availableStates, setAvailableStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // User profile state
  const EMPTY_PROFILE = {
    id: "",
    displayName: "",
    age: "",
    gender: "",
    bio: "",
    interests: [],
    height: "",
    bodyType: "",
    maritalStatus: "",
    hairColor: "",
    eyeColor: "",
    transportation: "",
    tattoo: "",
    piercing: "",
    smoker: "",
    lookingGender: "",
    lookingState: "",
    city: "",
    country: "",
    profilePicture: "",
    minAgePreference: 18,
    maxAgePreference: 99,
    maxDistanceKm: 50,
    relationshipGoals: [],
    genderPreference: [],
  };

  const [profile, setProfile] = useState(EMPTY_PROFILE);

  // Interest Section
  const INTEREST_OPTIONS = [
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

  const HEIGHT_OPTIONS = [
    "",
    "Shorter than 4'7\"",
    "From 4'7\" till 4'11\" ",
    "From 4'11\" till 5'3\"",
    "From 5'3\" till 5'7\"",
    "From 5'7\" till 5'11\"",
    "From 5'11\" till 6'3\"",
    "From 6'3\" till 6'7\"",
    "Taller than 6'7\"",
  ];
  const BODY_TYPE_OPTIONS = [
    "",
    "Slim",
    "Average",
    "Athletic",
    "Curvy",
    "Slim",
  ];
  const MARITAL_STATUS_OPTIONS = [
    "",
    "Divorced",
    "Married",
    "Relationship",
    "Living together",
    "Living apart together",
    "Single",
    "Widowed",
  ];
  const HAIR_COLOR_OPTIONS = [
    "",
    "Black",
    "Brown",
    "Blonde",
    "Red",
    "Bald",
    "Dark blonde",
    "Other",
  ];
  const EYE_COLOR_OPTIONS = [
    "",
    "Brown",
    "Blue",
    "Green",
    "Hazel",
    "Grey",
    "Other",
  ];
  const TRANSPORTATION_OPTIONS = [
    "",
    "Car",
    "Moped",
    "Bicycle",
    "Motorbike",
    "None",
    "Public transport",
    "Scooter",
    "Mobility scooter",
    "Taxi",
  ];
  const TATTOO_OPTIONS = ["", "Yes", "No"];
  const PIERCING_OPTIONS = ["", "Yes", "No"];
  const SMOKING_OPTIONS = ["", "Yes", "No"];

  // Looking for
  const GENDER_OPTIONS = ["", "Woman", "Man", "Non-binary", "Any"];

  // Fetch available states based on user's country
  useEffect(() => {
    const fetchStatesByCountry = async () => {
      if (!profile.country) return;

      setLoadingStates(true);
      try {
        const { data, error } = await supabase
          .from("fictional_profiles")
          .select("state")
          .eq("country", profile.country)
          .not("state", "is", null)
          .not("state", "eq", "");

        if (error) throw error;

        // Get unique states
        const uniqueStates = [
          ...new Set(data.map((item) => item.state).filter(Boolean)),
        ];
        uniqueStates.sort();

        setAvailableStates(uniqueStates);
      } catch (err) {
        console.error("Error fetching states:", err);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStatesByCountry();
  }, [profile.country]);

  const AGE_OPTIONS = Array.from({ length: 83 }, (_, i) => i + 18); // 18 → 100

  // New functions

  const [privacy, setPrivacy] = useState({
    discovery: true,
    showDistance: true,
    showLastActive: false,
    allowDataForMatching: true,
    shareAnalytics: false,
    personalizedRecommendations: true,
  });

  // small helper to toggle boolean nested state
  function togglePrivacy(key) {
    setPrivacy((p) => ({ ...p, [key]: !p[key] }));
  }

  // Second added
  function downloadReceipt(desc = "receipt") {
    // simulate a small text file download
    const blob = new Blob(
      [
        `This is a simulated ${desc} generated on ${new Date().toLocaleString()}`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${desc.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function confirmDeleteAccount() {
    if (
      confirm(
        "Are you sure you want to delete your account? This action is irreversible.",
      )
    ) {
      alert("Account deleted (simulated).");
    }
  }

  // Notification
  const [notifications, setNotifications] = useState({
    newMatchesEmail: true,
    newMatchesPush: true,
    newMessagesEmail: false,
    newMessagesPush: true,
    superLikesEmail: true,
    superLikesPush: true,
    weeklyDigestEmail: true,
    datingTipsEmail: false,
    specialOffersEmail: true,
    quietHoursEnabled: true,
    quietFrom: "22:00",
    quietTo: "08:00",
  });

  function testNotifications() {
    alert("Test notification sent (simulated)");
  }

  useEffect(() => {
    fetchUserData();
    fetchSentImages();
  }, []);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("user_profiles") // ✅ correct table
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setUserProfileId(null);
        setProfile({
          ...EMPTY_PROFILE,
          authUserId: user.id,
          id: null,
          email: user.email,
        });
        return;
      }

      setUserProfileId(data.id);

      setProfile({
        id: user.id,
        authUserId: user.id,
        displayName: data.display_name ?? "",
        email: user.email ?? "",
        age: data.age ?? "",
        gender: data.gender ?? "",
        bio: data.bio ?? "",
        interests: data.interests ?? [],
        height: data.height ?? "",
        bodyType: data.body_type ?? "",
        maritalStatus: data.marital_status ?? "",
        hairColor: data.hair_color ?? "",
        eyeColor: data.eye_color ?? "",
        transportation: data.transportation ?? "",
        tattoo: data.tattoo ?? "",
        piercing: data.piercing ?? "",
        smoker: data.smoker ?? "",
        lookingGender: data.looking_gender ?? "",
        lookingState: data.looking_state ?? "",
        city: data.city ?? "",
        country: data.country ?? "",
        profilePicture: data.profile_img ?? "",
        minAgePreference: data.min_age_preference ?? 18,
        maxAgePreference: data.max_age_preference ?? 99,
        maxDistanceKm: data.max_distance_km ?? 50,
        relationshipGoals: data.relationship_goals ?? [],
        genderPreference: data.gender_preference ?? [],
      });
    } catch (err) {
      console.error(err);
      toast.error("Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Fetch gallery photos when profile is loaded
  useEffect(() => {
    if (userProfileId) {
      console.log("🖼️ Fetching gallery photos for:", userProfileId);
      fetchGalleryPhotos();
    }
  }, [userProfileId]);

  // ProfileImageSrc
  const profileImageSrc = profile.profilePicture || DefaultAvatar;

  // Fetch sent images
  const fetchSentImages = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("message_images")
        .select(`*`)
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setSentImages(
        data.map((img) => ({
          id: img.id, // each image row has a unique ID
          url: img.image_url,
          date: img.created_at,
          recipient: img.recipient_id?.display_name || "Unknown", // fetch directly from table
        })),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sent images");
    }
  };

  // Handle profile picture upload
  // Handle profile picture upload
  const handleProfilePictureUpload = async (file) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error("Upload JPG, PNG, or WebP only");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Image must be under 5MB");
      return;
    }

    try {
      setUploading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) throw new Error("Not authenticated");

      const userId = user.id;
      const fileExt = file.name.split(".").pop();
      // ✅ Use a clean path for profile pictures
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${userId}/${fileName}`;

      // Upload to Chat-images bucket but organized in folders
      const { error: uploadError } = await supabase.storage
        .from("Chat-images")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("Chat-images")
        .getPublicUrl(filePath);

      // Update database
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ profile_img: data.publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      console.log(
        "Is this the same ID?",
        userId,
        "should equal",
        "42df6609-355d-4f5e-9c4a-0ffde898780b",
      );

      // Update state
      setProfile((p) => ({
        ...p,
        profilePicture: data.publicUrl,
      }));

      toast.success("Profile picture updated!");
      // Refresh to ensure consistency
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Save profile
  const saveProfile = async () => {
    try {
      setLoading(true);

      if (!profile.id) throw new Error("Missing user id");

      const payload = {
        display_name: profile.displayName || null,
        age: profile.age === "" ? null : Number(profile.age),
        city: profile.city || null,
        bio: profile.bio || null,
        interests: profile.interests.length ? profile.interests : null,
        height: profile.height || null,
        body_type: profile.bodyType || null,
        marital_status: profile.maritalStatus || null,
        hair_color: profile.hairColor || null,
        eye_color: profile.eyeColor || null,
        piercing: profile.piercing || null,
        smoker: profile.smoker || null,
        transportation: profile.transportation || null,
        tattoo: profile.tattoo || null,
        looking_gender: profile.lookingGender || null,
        looking_state: profile.lookingState || null,
        profile_img: profile.profilePicture || null,
        min_age_preference: Number(profile.minAgePreference),
        max_age_preference: Number(profile.maxAgePreference),
        max_distance_km: Number(profile.maxDistanceKm),
        relationship_goals: profile.relationshipGoals.length
          ? profile.relationshipGoals
          : null,
        gender_preference: profile.genderPreference.length
          ? profile.genderPreference
          : null,
      };

      // Optional: remove undefined keys (extra safety)
      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k],
      );

      const { error } = await supabase
        .from("user_profiles")
        .update(payload)
        .eq("user_id", profile.id);

      if (error) throw error;

      toast.success("Profile saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setShowMobileContent(true);
    }
  };

  // Password Update Logic
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You are not logged in");
      }

      // Re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      alert("Password updated successfully ✅");

      // Clear sensitive fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // Detect Login Provider
  useEffect(() => {
    const loadUserProvider = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Failed to get user:", error.message);
      } else {
        setProvider(user?.app_metadata?.provider || null);
      }

      setCheckingAuth(false);
    };

    loadUserProvider();
  }, []);

  // Replace your existing functions with these:

  async function loadBlockedUsers() {
    // Wait for profile to be loaded
    if (!userProfileId) {
      toast.error("Loading profile... Please try again in a moment.");
      return;
    }

    setLoadingBlocked(true);
    try {
      console.log("Fetching blocked users for profile ID:", userProfileId);

      const { data, error } = await supabase
        .from("blocked_profiles")
        .select(
          `
        id,
        blocked_at,
        fictional_profiles (
          id,
          display_name,
          image_url
        )
      `,
        )
        .eq("user_profile_id", userProfileId)
        .order("blocked_at", { ascending: false });

      if (error) throw error;

      setBlockedUsers(data || []);

      if (!data || data.length === 0) {
        console.log("You haven't blocked anyone yet.");
      }
    } catch (err) {
      console.error("Blocked users error:", err);
      toast.error("Failed to load blocked users: " + err.message);
    } finally {
      setLoadingBlocked(false);
    }
  }

  async function loadReports() {
    if (!userProfileId) {
      toast.error("User profile not loaded");
      return;
    }

    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(
          `
        id,
        reason,
        status,
        reported_at,
        fictional_profiles (
          display_name,
          image_url
        )
      `,
        )
        .eq("reporter_profile_id", userProfileId)
        .order("reported_at", { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (err) {
      console.error("Reports error:", err);
      toast.error("Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  }

  // Auto‑fetch blocked users and reports once the userProfileId is available
  useEffect(() => {
    if (userProfileId) {
      loadBlockedUsers();
      loadReports();
    }
  }, [userProfileId]);

  // Fetch gallery photos from Supabase
  const fetchGalleryPhotos = async () => {
    if (!userProfileId) return;

    try {
      const { data, error } = await supabase
        .from("user_gallery_photos")
        .select("*")
        .eq("user_profile_id", userProfileId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setGalleryPhotos(data || []);
    } catch (err) {
      console.error("Error fetching gallery photos:", err);
    }
  };

  // Upload gallery photo
  const handleGalleryUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (galleryPhotos.length >= 12) {
      toast.error("Maximum 12 photos allowed");
      return;
    }

    setUploadingGallery(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `gallery-photos/${userProfileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("Chat-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("Chat-images")
        .getPublicUrl(filePath);

      const { data: inserted, error: dbError } = await supabase
        .from("user_gallery_photos")
        .insert({
          user_profile_id: userProfileId,
          image_url: urlData.publicUrl,
          display_order: galleryPhotos.length,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setGalleryPhotos((prev) => [...prev, inserted]);
      toast.success("Photo added to gallery!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingGallery(false);
    }
  };

  // Delete gallery photo
  const deleteGalleryPhoto = async (photoId, index) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const { error } = await supabase
        .from("user_gallery_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      // Remove from state
      setGalleryPhotos((prev) => prev.filter((_, i) => i !== index));
      toast.success("Photo deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete photo");
    }
  };

  // Set a gallery photo as profile picture
  const setAsProfilePicture = async (imageUrl) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ profile_img: imageUrl })
        .eq("user_id", profile.authUserId);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, profilePicture: imageUrl }));
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error("Set profile picture error:", err);
      toast.error("Failed to update profile picture");
    }
  };

  const navButtonClass = (tab) => {
    const base =
      "w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center space-x-3";
    const active = "bg-primary/10 text-primary font-medium shadow-sm";
    const inactive = "text-gray-600 hover:bg-gray-50 hover:text-primary";
    return `${base} ${activeTab === tab ? active : inactive}`;
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <LoveSpinner size="large" color="#ff6b6b" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      {isImageModalOpen && selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedImage(null);
          }}
        />
      )}

      <main className="min-h-screen pt-16 ">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Navigation Sidebar */}
            <div
              className={`lg:col-span-1 ${showMobileContent ? "hidden lg:block" : ""}`}
            >
              <div className="card rounded-xl shadow-sm border p-6 sticky top-24">
                <h3 className="text-lg  font-serif font-semibold text-text-primary mb-6">
                  Settings
                </h3>
                <nav className="space-y-2">
                  {[
                    { id: "profile", label: "Profile", icon: "user" },
                    {
                      id: "privacy",
                      label: "Privacy & Safety",
                      icon: "shield",
                    },
                    {
                      id: "notifications",
                      label: "Notifications",
                      icon: "bell",
                    },

                    { id: "security", label: "Security", icon: "lock" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={navButtonClass(tab.id)}
                    >
                      <TabIcon icon={tab.icon} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div
              className={`lg:col-span-3 ${showMobileContent ? "" : "hidden lg:block"}`}
            >
              {/* Back button for mobile */}
              {showMobileContent && (
                <button
                  onClick={() => setShowMobileContent(false)}
                  className="lg:hidden mb-6 flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to menu
                </button>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="bg-background grid lg:grid-cols-3 gap-8">
                  {/* Left Column - Profile Picture and Info */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Profile Picture Section */}
                    <div className="card rounded-xl shadow-sm border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Profile Picture
                        </h2>

                        <span className="px-3 py-1 bg-success-100 text-success-100 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer group relative">
                            <img
                              src={profileImageSrc}
                              alt="Profile picture"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.onerror = null; // prevent infinite loop
                                e.currentTarget.src = DefaultAvatar;
                              }}
                              onClick={() => setActiveImage(profileImageSrc)}
                              // onClick={() =>
                              //   profile.profilePicture &&
                              //   handleImageClick({
                              //     url: profile.profilePicture,
                              //     title: "Profile Picture",
                              //   })
                              // }
                            />

                            {uploading && (
                              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}

                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="absolute bottom-4 right-4 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-50"
                              title="Change profile picture"
                            >
                              {/* icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                              </svg>
                            </button>

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) =>
                                handleProfilePictureUpload(e.target.files?.[0])
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Photo Gallery Section */}
                    <div className="card rounded-xl shadow-sm border p-6 mt-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Photo Gallery
                          </h2>
                          <p className="text-sm text-gray-500 mt-1">
                            Add photos to your profile (max 12 photos)
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            document
                              .getElementById("gallery-photo-input")
                              ?.click()
                          }
                          disabled={uploadingGallery}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
                        >
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Add Photo
                        </button>
                        <input
                          id="gallery-photo-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) =>
                            handleGalleryUpload(e.target.files?.[0])
                          }
                        />
                      </div>

                      {/* Photo Grid */}
                      {galleryPhotos.length === 0 ? (
                        <div className="text-center py-12 bg-primary/10 rounded-lg border-2 border-dashed border-gray-300">
                          <svg
                            className="w-16 h-16 mx-auto text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-gray-500">No photos yet</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Click "Add Photo" to upload your first photo
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {galleryPhotos.map((photo, index) => (
                            <div
                              key={photo.id || index}
                              className="relative group"
                            >
                              {/* Photo Card */}
                              <div className="relative rounded-xl overflow-hidden aspect-square bg-gray-100 shadow-md">
                                <img
                                  src={photo.image_url}
                                  alt={`Gallery photo ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                  onClick={() =>
                                    setActiveImage(photo.image_url)
                                  }
                                />

                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                                  {/* Set as Profile Button */}
                                  <button
                                    onClick={() =>
                                      setAsProfilePicture(photo.image_url)
                                    }
                                    className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition"
                                    title="Set as profile picture"
                                  >
                                    <svg
                                      className="w-5 h-5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() =>
                                      deleteGalleryPhoto(photo.id, index)
                                    }
                                    className="p-2 bg-red-500/80 rounded-full hover:bg-red-600 transition"
                                    title="Delete photo"
                                  >
                                    <svg
                                      className="w-5 h-5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>

                                {/* Profile Picture Badge */}
                                {photo.image_url === profile.profilePicture && (
                                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                                    Profile
                                  </div>
                                )}
                              </div>

                              {/* Drag handle for reordering */}
                              <div className="absolute bottom-2 right-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg
                                  className="w-5 h-5 text-white drop-shadow-md"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 8h16M4 16h16"
                                  />
                                </svg>
                              </div>
                            </div>
                          ))}

                          {/* Add more button if less than max */}
                          {galleryPhotos.length < 12 && (
                            <button
                              onClick={() =>
                                document
                                  .getElementById("gallery-photo-input")
                                  ?.click()
                              }
                              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition flex flex-col items-center justify-center gap-2"
                            >
                              <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              <span className="text-xs text-gray-500">
                                Add Photo
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Basic Information */}
                    <div className="card rounded-xl shadow-sm border p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Basic Information
                      </h2>
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-1 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={profile.displayName}
                              onChange={(e) =>
                                setProfile((p) => ({
                                  ...p,
                                  firstName: e.target.value,
                                }))
                              }
                              className="form-input"
                              placeholder="Enter a username"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="email"
                              value={profile.email}
                              readOnly
                              className="form-input"
                            />
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Verified
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio
                          </label>
                          <textarea
                            value={profile.bio}
                            onChange={(e) =>
                              setProfile((p) => ({ ...p, bio: e.target.value }))
                            }
                            className="form-input min-h-[100px] resize-none"
                            placeholder="Tell others about yourself..."
                            maxLength={500}
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>Briefly describe yourself</span>
                            <span>{profile.bio?.length || 0}/500</span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Age
                            </label>
                            <input
                              type="number"
                              min="18"
                              max="100"
                              value={profile.age}
                              onChange={(e) =>
                                setProfile((p) => ({
                                  ...p,
                                  age: e.target.value,
                                }))
                              }
                              className="form-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              value={profile.city}
                              onChange={(e) =>
                                setProfile((p) => ({
                                  ...p,
                                  city: e.target.value,
                                }))
                              }
                              className="form-input"
                              placeholder="City, State"
                            />
                          </div>
                        </div>

                        {/* New Line */}
                        <div className="mb-6 border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowInterests((o) => !o)}
                            className="w-full flex justify-between items-center p-4 bg-gray-600 text-black font-medium"
                          >
                            <span>Interests</span>
                            <span>{showInterests ? "▲" : "▼"}</span>
                          </button>

                          {showInterests && (
                            <div className="p-4 bg-white">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {INTEREST_OPTIONS.map((interest) => {
                                  const checked =
                                    profile.interests.includes(interest);

                                  return (
                                    <label
                                      key={interest}
                                      className="flex items-center gap-2"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          setProfile((p) => {
                                            const exists =
                                              p.interests.includes(interest);
                                            return {
                                              ...p,
                                              interests: exists
                                                ? p.interests.filter(
                                                    (i) => i !== interest,
                                                  )
                                                : [...p.interests, interest],
                                            };
                                          })
                                        }
                                      />
                                      <span>{interest}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Personal Data */}
                        <div className="mb-6 border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowPersonal((o) => !o)}
                            className="w-full flex justify-between items-center p-4 bg-gray-600 text-black font-medium"
                          >
                            <span>Personal Information</span>
                            <span>{showPersonal ? "▲" : "▼"}</span>
                          </button>

                          {showPersonal && (
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm mb-1">
                                  Height
                                </label>
                                <select
                                  value={profile.height}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      height: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {HEIGHT_OPTIONS.map((h) => (
                                    <option key={h || "empty"} value={h}>
                                      {h || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm mb-1">
                                  Body Type
                                </label>
                                <select
                                  value={profile.bodyType}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      bodyType: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {BODY_TYPE_OPTIONS.map((opt, idx) => (
                                    <option key={`${opt}-${idx}`} value={opt}>
                                      {opt || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm mb-1">
                                  Marital status
                                </label>
                                <select
                                  value={profile.maritalStatus}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      maritalStatus: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {MARITAL_STATUS_OPTIONS.map((c) => (
                                    <option key={c || "empty"} value={c}>
                                      {c || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm mb-1">
                                  Hair Color
                                </label>
                                <select
                                  value={profile.hairColor}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      hairColor: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {HAIR_COLOR_OPTIONS.map((c) => (
                                    <option key={c || "empty"} value={c}>
                                      {c || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm mb-1">
                                  Eye Color
                                </label>
                                <select
                                  value={profile.eyeColor}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      eyeColor: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {EYE_COLOR_OPTIONS.map((c) => (
                                    <option key={c || "empty"} value={c}>
                                      {c || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm mb-1">
                                  Transportation
                                </label>
                                <select
                                  value={profile.transportation}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      transportation: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {TRANSPORTATION_OPTIONS.map((c) => (
                                    <option key={c || "empty"} value={c}>
                                      {c || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm mb-1">
                                  Tattoo
                                </label>
                                <select
                                  value={profile.tattoo}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      tattoo: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {TATTOO_OPTIONS.map((c) => (
                                    <option key={c || "empty"} value={c}>
                                      {c || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm mb-1">
                                  Piercing
                                </label>
                                <select
                                  value={profile.piercing}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      piercing: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {PIERCING_OPTIONS.map((c) => (
                                    <option key={c || "empty"} value={c}>
                                      {c || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm mb-1">
                                  Smoker
                                </label>
                                <select
                                  value={profile.smoker}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      smoker: e.target.value,
                                    }))
                                  }
                                  className="form-input"
                                >
                                  {SMOKING_OPTIONS.map((c) => (
                                    <option key={c || "empty"} value={c}>
                                      {c || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Preferences Section */}
                        <div className="pt-6 border-t">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Matching Preferences
                          </h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Age Range
                              </label>
                              <div className="flex items-center space-x-4">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    value={profile.minAgePreference}
                                    min="18"
                                    max="100"
                                    onChange={(e) =>
                                      setProfile((p) => ({
                                        ...p,
                                        minAgePreference: e.target.value,
                                      }))
                                    }
                                    className="form-input w-full"
                                  />
                                </div>
                                <span className="text-gray-500">to</span>
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    value={profile.maxAgePreference}
                                    min="18"
                                    max="100"
                                    onChange={(e) =>
                                      setProfile((p) => ({
                                        ...p,
                                        maxAgePreference: e.target.value,
                                      }))
                                    }
                                    className="form-input w-full"
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Distance
                              </label>
                              <select
                                className="form-input"
                                value={profile.maxDistanceKm}
                                onChange={(e) =>
                                  setProfile((p) => ({
                                    ...p,
                                    maxDistanceKm: e.target.value,
                                  }))
                                }
                              >
                                <option value="10 miles">10 miles</option>
                                <option value="25 miles">25 miles</option>
                                <option value="50 miles">50 miles</option>
                                <option value="100 miles">100 miles</option>
                                <option value="Anywhere">Anywhere</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Relationship Goals
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {[
                                {
                                  key: "longterm",
                                  label: "Long-term",
                                  icon: "❤️",
                                },
                                {
                                  key: "casual",
                                  label: "Casual dating",
                                  icon: "😊",
                                },
                                {
                                  key: "marriage",
                                  label: "Marriage",
                                  icon: "💍",
                                },
                              ].map((goal) => {
                                const selected =
                                  profile.relationshipGoals.includes(goal.key);

                                return (
                                  <label
                                    key={goal.key}
                                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() =>
                                        setProfile((p) => {
                                          const exists =
                                            p.relationshipGoals.includes(
                                              goal.key,
                                            );
                                          return {
                                            ...p,
                                            relationshipGoals: exists
                                              ? p.relationshipGoals.filter(
                                                  (g) => g !== goal.key,
                                                )
                                              : [
                                                  ...p.relationshipGoals,
                                                  goal.key,
                                                ],
                                          };
                                        })
                                      }
                                      className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5"
                                    />
                                    <span className="ml-3 text-lg mr-2">
                                      {goal.icon}
                                    </span>
                                    <span className="text-sm text-gray-700">
                                      {goal.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="mb-6 border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowLookingFor((o) => !o)}
                            className="w-full flex justify-between items-center p-4 bg-gray-600 text-black font-medium"
                          >
                            <span>I'm looking for</span>
                            <span>{showLookingFor ? "▲" : "▼"}</span>
                          </button>

                          {showLookingFor && (
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Gender */}
                              <div>
                                <label className="block text-sm mb-1">
                                  Gender
                                </label>
                                <select
                                  value={profile.lookingGender}
                                  onChange={(e) =>
                                    setProfile((p) => ({
                                      ...p,
                                      lookingGender: e.target.value,
                                    }))
                                  }
                                  className="form-input w-full"
                                >
                                  {GENDER_OPTIONS.map((g) => (
                                    <option key={g || "empty"} value={g}>
                                      {g || "--Please Select--"}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* State - NOW DYNAMIC */}
                              <div>
                                <label className="block text-sm mb-1">
                                  State
                                </label>
                                {loadingStates ? (
                                  <div className="form-input w-full bg-gray-100 animate-pulse">
                                    Loading states...
                                  </div>
                                ) : (
                                  <select
                                    value={profile.lookingState}
                                    onChange={(e) =>
                                      setProfile((p) => ({
                                        ...p,
                                        lookingState: e.target.value,
                                      }))
                                    }
                                    className="form-input w-full"
                                  >
                                    <option value="">-- All States --</option>
                                    {availableStates.map((state) => (
                                      <option key={state} value={state}>
                                        {state}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-6">
                          <button
                            onClick={saveProfile}
                            disabled={loading}
                            className="btn-primary px-8 py-3 text-lg font-medium"
                          >
                            {loading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Sent Images Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="card rounded-xl shadow-sm border p-6 sticky top-24">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                          Sent Images
                        </h2>
                        <span className="text-sm text-gray-500">
                          {sentImages.length} photos
                        </span>
                      </div>

                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Images you've shared in conversations
                        </p>

                        {/* Images Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          {sentImages.map((image) => (
                            <div
                              key={image.id}
                              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                              onClick={() => handleImageClick(image)}
                            >
                              <img
                                src={image.url}
                                alt={`Sent to ${image.recipient}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute bottom-2 left-2 right-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="truncate">
                                  To: {image.recipient}
                                </div>
                                <div className="text-xs opacity-75">
                                  {new Date(image.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* View All Button */}
                        {sentImages.length > 6 && (
                          <button
                            onClick={() => {
                              // Navigate to full gallery or open modal
                              toast.success("Opening image gallery");
                            }}
                            className="w-full mt-4 py-2 text-primary hover:text-primary-600 font-medium text-sm"
                          >
                            View All Images →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Tabs (keep your existing structure for other tabs) */}
              {/* Privacy Tab */}
              {activeTab === "privacy" && (
                <div className="settings-tab-content">
                  <div className="card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-serif font-semibold text-text-primary">
                        Privacy &amp; Safety
                      </h2>
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-success-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium text-success-600">
                          GDPR Compliant
                        </span>
                      </div>
                    </div>

                    {/*  Privacy Controls */}
                    <div className="space-y-6">
                      <div className="bg-primary-50 rounded-lg p-4">
                        <h3 className="text-lg font-serif font-semibold text-text-primary mb-2">
                          Profile Visibility
                        </h3>
                        <p className="text-text-secondary text-sm mb-4">
                          Control who can see your profile and personal
                          information
                        </p>

                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-text-primary">
                              Show me in discovery
                            </span>
                            <input
                              type="checkbox"
                              checked={privacy.discovery}
                              onChange={() => togglePrivacy("discovery")}
                              className="toggle-switch"
                            />
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-text-primary">
                              Show last active status
                            </span>
                            <input
                              type="checkbox"
                              checked={privacy.showLastActive}
                              onChange={() => togglePrivacy("showLastActive")}
                              className="toggle-switch"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Safety Controls */}
                      <div className="border-t border-primary/10 pt-6">
                        <h3 className="text-lg font-serif font-semibold text-text-primary mb-4">
                          Safety Controls
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                          <button
                            className="flex items-center justify-center space-x-2 px-4 py-3 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors duration-300"
                            onClick={() => {
                              (loadBlockedUsers(), setShowBlocked(true));
                            }}
                          >
                            <svg
                              className="w-5 h-5 text-text-secondary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                            <span className="text-text-primary">
                              Blocked Users ({blockedUsers.length})
                            </span>
                          </button>

                          <button
                            className="flex items-center justify-center space-x-2 px-4 py-3 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors duration-300"
                            onClick={() => {
                              (loadReports(), setShowReports(true));
                            }}
                          >
                            <svg
                              className="w-5 h-5 text-text-secondary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01M4.35 16.5L13.732 4c.77-.833 1.732-.833 2.464 0l6.732 9.5c.77.833-.192 2.5-1.732 2.5H6.082"
                              />
                            </svg>
                            <span className="text-text-primary">
                              Report History ({reports.length})
                            </span>
                          </button>
                        </div>
                      </div>

                      {showBlocked && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                            <div className="p-5 border-b flex justify-between items-center">
                              <h3 className="text-xl font-semibold">
                                Blocked Users
                              </h3>
                              <button
                                onClick={() => setShowBlocked(false)}
                                className="text-2xl"
                              >
                                &times;
                              </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-3">
                              {loadingBlocked ? (
                                <div className="flex justify-center py-8">
                                  <LoveSpinner size="small" />
                                </div>
                              ) : blockedUsers.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                  You haven't blocked anyone.
                                </p>
                              ) : (
                                blockedUsers.map((block) => (
                                  <div
                                    key={block.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <img
                                        src={
                                          block.fictional_profiles?.image_url ||
                                          DefaultAvatar
                                        }
                                        className="w-10 h-10 rounded-full object-cover"
                                        alt={
                                          block.fictional_profiles?.display_name
                                        }
                                      />
                                      <div>
                                        <p className="font-medium">
                                          {
                                            block.fictional_profiles
                                              ?.display_name
                                          }
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Blocked on{" "}
                                          {new Date(
                                            block.blocked_at,
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        unblockUser(
                                          block.id,
                                          block.fictional_profiles
                                            ?.display_name,
                                        )
                                      }
                                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                      Unblock
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {showReports && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                            <div className="p-5 border-b flex justify-between items-center">
                              <h3 className="text-xl font-semibold">
                                Report History
                              </h3>
                              <button
                                onClick={() => setShowReports(false)}
                                className="text-2xl"
                              >
                                &times;
                              </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                              {loadingReports ? (
                                <div className="flex justify-center py-8">
                                  <LoveSpinner size="small" />
                                </div>
                              ) : reports.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                  You haven't reported anyone.
                                </p>
                              ) : (
                                reports.map((report) => (
                                  <div
                                    key={report.id}
                                    className="p-4 bg-gray-50 rounded-lg space-y-2"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <img
                                        src={
                                          report.fictional_profiles
                                            ?.image_url || DefaultAvatar
                                        }
                                        className="w-10 h-10 rounded-full object-cover"
                                        alt={
                                          report.fictional_profiles
                                            ?.display_name
                                        }
                                      />
                                      <div>
                                        <p className="font-medium">
                                          {
                                            report.fictional_profiles
                                              ?.display_name
                                          }
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Reported on{" "}
                                          {new Date(
                                            report.reported_at,
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="pl-13">
                                      <p className="text-sm text-gray-700">
                                        <span className="font-semibold">
                                          Reason:
                                        </span>{" "}
                                        {report.reason}
                                      </p>
                                      <p className="text-xs mt-1">
                                        <span
                                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                    ${
                      report.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : report.status === "reviewed"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                                        >
                                          {report.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            report.status.slice(1)}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Data Rights */}
                      <div className="hidden border-t border-primary/10 pt-6">
                        <h3 className="text-lg font-serif font-semibold text-text-primary mb-4">
                          Your Data Rights
                        </h3>

                        <div className="grid md:grid-cols-3 gap-4">
                          <button
                            className="flex flex-col items-center space-y-2 p-4 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors duration-300"
                            onClick={() => downloadReceipt("user-data")}
                          >
                            <svg
                              className="w-6 h-6 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 10v6m0 0l-3-3m3 3l3-3M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-sm font-medium text-text-primary">
                              Download Data
                            </span>
                          </button>

                          <button
                            className="flex flex-col items-center space-y-2 p-4 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors duration-300"
                            onClick={() => downloadReceipt("backup-settings")}
                          >
                            <svg
                              className="w-6 h-6 text-warning-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                              />
                            </svg>
                            <span className="text-sm font-medium text-text-primary">
                              Backup Settings
                            </span>
                          </button>

                          <button
                            className="flex flex-col items-center space-y-2 p-4 border border-error/20 rounded-lg hover:bg-error/5 transition-colors duration-300"
                            onClick={confirmDeleteAccount}
                          >
                            <svg
                              className="w-6 h-6 text-error"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862A2 2 0 015.867 19.142L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3"
                              />
                            </svg>
                            <span className="text-sm font-medium text-text-primary">
                              Delete Account
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="settings-tab-content">
                  <div className="card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-serif font-semibold text-text-primary">
                        Notification Preferences
                      </h2>
                    </div>

                    {/* Notification Categories */}
                    <div className="space-y-6">
                      <div className="bg-accent-50 rounded-lg p-4">
                        <h3 className="text-lg font-serif font-semibold text-text-primary mb-4">
                          Matches &amp; Messages
                        </h3>

                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                            <div className="w-full sm:flex-1">
                              <p className="font-medium text-text-primary">
                                New Matches
                              </p>
                              <p className="text-sm text-text-secondary">
                                Get notified when someone likes you
                              </p>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:space-x-4 items-center">
                              <label className="flex items-center space-x-2 w-full sm:w-auto">
                                <input
                                  type="checkbox"
                                  checked={notifications.newMatchesEmail}
                                  onChange={() =>
                                    setNotifications((n) => ({
                                      ...n,
                                      newMatchesEmail: !n.newMatchesEmail,
                                    }))
                                  }
                                  className="rounded border-primary/20 text-primary focus:ring-primary/30"
                                />
                                <span className="ml-2 text-sm">Email</span>
                              </label>
                              <label className="flex items-center space-x-2 w-full sm:w-auto">
                                <input
                                  type="checkbox"
                                  checked={notifications.newMatchesPush}
                                  onChange={() =>
                                    setNotifications((n) => ({
                                      ...n,
                                      newMatchesPush: !n.newMatchesPush,
                                    }))
                                  }
                                  className="rounded border-primary/20 text-primary focus:ring-primary/30"
                                />
                                <span className="ml-2 text-sm">Push</span>
                              </label>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                            <div className="w-full sm:flex-1">
                              <p className="font-medium text-text-primary">
                                New Messages
                              </p>
                              <p className="text-sm text-text-secondary">
                                Instant notifications for new messages
                              </p>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:space-x-4 items-center">
                              <label className="flex items-center space-x-2 w-full sm:w-auto">
                                <input
                                  type="checkbox"
                                  checked={notifications.newMessagesEmail}
                                  onChange={() =>
                                    setNotifications((n) => ({
                                      ...n,
                                      newMessagesEmail: !n.newMessagesEmail,
                                    }))
                                  }
                                  className="rounded border-primary/20 text-primary focus:ring-primary/30"
                                />
                                <span className="ml-2 text-sm">Email</span>
                              </label>
                              <label className="flex items-center space-x-2 w-full sm:w-auto">
                                <input
                                  type="checkbox"
                                  checked={notifications.newMessagesPush}
                                  onChange={() =>
                                    setNotifications((n) => ({
                                      ...n,
                                      newMessagesPush: !n.newMessagesPush,
                                    }))
                                  }
                                  className="rounded border-primary/20 text-primary focus:ring-primary/30"
                                />
                                <span className="ml-2 text-sm">Push</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quiet Hours */}
                      <div className="border-t border-primary/10 pt-6">
                        <h3 className="text-lg font-serif font-semibold text-text-primary mb-4">
                          Quiet Hours
                        </h3>
                        <p className="text-text-secondary text-sm mb-4">
                          Set times when you don't want to receive push
                          notifications
                        </p>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                          <label className="flex items-center w-full sm:w-auto space-x-2">
                            <input
                              type="checkbox"
                              checked={notifications.quietHoursEnabled}
                              onChange={() =>
                                setNotifications((n) => ({
                                  ...n,
                                  quietHoursEnabled: !n.quietHoursEnabled,
                                }))
                              }
                              className="rounded border-primary/20 text-primary focus:ring-primary/30"
                            />
                            <span className="ml-2 text-text-primary">
                              Enable quiet hours
                            </span>
                          </label>

                          <div className="flex w-full sm:w-auto flex-col sm:flex-row items-start sm:items-center gap-2">
                            <input
                              type="time"
                              value={notifications.quietFrom}
                              onChange={(e) =>
                                setNotifications((n) => ({
                                  ...n,
                                  quietFrom: e.target.value,
                                }))
                              }
                              className="form-input w-32"
                            />
                            <span className="text-text-secondary">to</span>
                            <input
                              type="time"
                              value={notifications.quietTo}
                              onChange={(e) =>
                                setNotifications((n) => ({
                                  ...n,
                                  quietTo: e.target.value,
                                }))
                              }
                              className="form-input w-32"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="settings-tab-content">
                  <div className="card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-serif  font-semibold text-text-primary">
                        Account Security
                      </h2>
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-success-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium text-success-600">
                          Secure
                        </span>
                      </div>
                    </div>

                    {checkingAuth ? (
                      <p>Loading security settings...</p>
                    ) : provider === "google" ? (
                      <div className="card p-4">
                        <p className="text-sm text-text-secondary mb-6">
                          You signed in with Google. Manage your password in
                          your Google account.
                        </p>
                        <a
                          href="https://myaccount.google.com/security"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary py-6"
                        >
                          Go to Google Security
                        </a>
                      </div>
                    ) : (
                      // Your change password form here
                      <form action="">
                        <div className="card rounded-lg p-4 mb-6">
                          <h3 className="text-lg font-serif font-semibold text-text-primary mb-2">
                            Current password:
                          </h3>
                          <input
                            type="password"
                            name="old_password"
                            className="form-input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>

                        <div className="card rounded-lg p-4 mb-6">
                          <h3 className="text-lg font-serif font-semibold text-text-primary mb-2">
                            New password:
                          </h3>
                          <input
                            type="password"
                            name="new_password"
                            className="form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>

                        <div className="card rounded-lg p-4 mb-6">
                          <h3 className="text-lg font-serif font-semibold text-text-primary mb-2">
                            Confirm password:
                          </h3>
                          <input
                            type="password"
                            name="confirm_password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn-primary"
                          onClick={handleChangePassword}
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            onClick={() => setActiveImage(null)}
          >
            <img
              src={activeImage || "No image yet"}
              alt="full"
              className="w-80 h-80 border boreder-white rounded-lg"
            />
          </div>
        )}

        {/* Footer */}
        <footer className="sticky top-[100vh] bg-text-primary text-white py-10">
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
      </main>
    </>
  );
}

// Icon component
function TabIcon({ icon }) {
  const icons = {
    user: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    shield: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    bell: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2z"
        />
      </svg>
    ),
    "credit-card": (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    lock: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    database: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
      </svg>
    ),
  };

  return icons[icon] || null;
}
