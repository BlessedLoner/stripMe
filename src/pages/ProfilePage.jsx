// **************************************** New Matters *************************
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// ----------------------------------------------------------------------
// Normalize profile data from the database
// ----------------------------------------------------------------------
function normalizeProfile(data) {
  if (!data) return null;

  const photos = Array.isArray(data.photos) ? data.photos.filter(Boolean) : [];

  const previewImages =
    photos.length > 0 ? photos : data.image_url ? [data.image_url] : [];

  return {
    id: data.id,
    display_name: data.display_name ?? "Unknown",
    age: data.age ?? null,
    bio: data.bio ?? null,
    about: data.about ?? null,

    image_url: data.image_url ?? null,

    previewImages: [data.image_url, ...photos].filter(Boolean),

    country: data.country ?? null,
    state: data.state ?? null,
    city: data.city ?? null,
    interests: data.interests ?? null,
    relationship: data.relationship ?? null,
    height: data.height ?? null,
    body_type: data.body_type ?? null,
    hair_colour: data.hair_color ?? null,
    eye_colour: data.eye_color ?? null,
    tattoo: data.tattoo ?? null,
    piercing: data.piercing ?? null,
    smoker: data.smoker ?? null,
  };
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function ProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Member passed from Members.jsx (preferred)
  const passedMember = location.state?.member ?? null;

  const [member, setMember] = useState(
    passedMember ? normalizeProfile(passedMember) : null,
  );
  const [loading, setLoading] = useState(!passedMember);
  const [error, setError] = useState(null);

  // Related profiles state
  const [relatedProfiles, setRelatedProfiles] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const [sendingFlirt, setSendingFlirt] = useState(null);
  const [showFlirtSuccess, setShowFlirtSuccess] = useState(false);
  const [lastFlirtConversationId, setLastFlirtConversationId] = useState(null);

  // Current authenticated user (for chat)
  const [currentUser, setCurrentUser] = useState(null);

  const [profile, setProfile] = useState(null);

  const [credits, setCredits] = useState(0);

  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);

  const [showLowCreditModal, setShowLowCreditModal] = useState(false);

  const [lowCreditWarningShown, setLowCreditWarningShown] = useState(false);

  const lowCreditThreshold = 5;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", currentUser.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        return;
      }

      setProfile(data);
    };

    fetchProfile();
  }, [currentUser]);

  async function loadCredits(pid = profile?.id) {
    if (!pid) return;

    const { data } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", pid)
      .single();

    if (data) {
      const newBalance = data.balance;

      setCredits(newBalance);

      // Low credit warning
      if (
        !lowCreditWarningShown &&
        newBalance > 0 &&
        newBalance < lowCreditThreshold
      ) {
        setShowLowCreditModal(true);
        setLowCreditWarningShown(true);
      }

      // Reset warning flag
      if (newBalance >= lowCreditThreshold) {
        setLowCreditWarningShown(false);
      }
    }
  }

  useEffect(() => {
    if (profile?.id) {
      loadCredits(profile.id);
    }
  }, [profile]);

  // --------------------------------------------------------------------
  // 1. Fetch current user on mount
  // --------------------------------------------------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // --------------------------------------------------------------------
  // 2. Fetch profile if not passed via state (direct URL)
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("fictional_profiles")
          .select("*") // ✅ includes photos
          .eq("id", id)
          .single();

        if (error) throw error;

        if (!cancelled) {
          console.log("🔥 FULL PROFILE:", data); // debug
          setMember(normalizeProfile(data));
        }
      } catch (err) {
        console.error("Profile fetch failed:", err);
        if (!cancelled) setError("Profile not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // --------------------------------------------------------------------
  // 3. Fetch related profiles when member is loaded
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!member) return;

    let active = true;
    setLoadingRelated(true);

    async function fetchRelated() {
      try {
        const memberAge = Number(member.age) || 25;

        const city = member.city?.trim();
        const state = member.state?.trim();
        const country = member.country?.trim();

        const minAge = Math.max(18, memberAge - 5);
        const maxAge = Math.min(99, memberAge + 5);

        console.log("🔍 Finding related profiles for:", {
          city,
          state,
          country,
          minAge,
          maxAge,
        });

        // --------------------------------------------------------------
        // Helper: fetch profiles using a particular location level
        // --------------------------------------------------------------
        async function fetchProfiles({
          useCity = false,
          useState = false,
          useCountry = false,
          minAgeValue = minAge,
          maxAgeValue = maxAge,
        }) {
          let query = supabase
            .from("fictional_profiles")
            .select("*")
            .neq("id", member.id)
            .eq("is_deleted", false)
            .gte("age", minAgeValue)
            .lte("age", maxAgeValue)
            .limit(50);

          if (useCountry && country) {
            query = query.ilike("country", country);
          }

          if (useState && state) {
            query = query.ilike("state", state);
          }

          if (useCity && city) {
            query = query.ilike("city", city);
          }

          const { data, error } = await query;

          if (error) throw error;

          return (data || []).map(normalizeProfile).filter(Boolean);
        }

        // --------------------------------------------------------------
        // We want up to 12 profiles.
        // Start with the most relevant location.
        // --------------------------------------------------------------
        const selectedProfiles = [];
        const selectedIds = new Set();

        const addProfiles = (profiles, tier) => {
          for (const profile of profiles) {
            if (selectedProfiles.length >= 12) break;

            if (selectedIds.has(profile.id)) continue;

            selectedIds.add(profile.id);

            profile._relatedTier = tier;

            selectedProfiles.push(profile);
          }
        };

        // --------------------------------------------------------------
        // TIER 1
        // Same city + state + country + age ±5
        // --------------------------------------------------------------
        if (city && state && country) {
          const sameCity = await fetchProfiles({
            useCity: true,
            useState: true,
            useCountry: true,
          });

          console.log(
            `📍 Tier 1: ${sameCity.length} profiles in ${city}, ${state}`,
          );

          addProfiles(sameCity, 1);
        }

        // --------------------------------------------------------------
        // TIER 2
        // Same state + country + age ±5
        // --------------------------------------------------------------
        if (selectedProfiles.length < 12 && state && country) {
          const sameState = await fetchProfiles({
            useState: true,
            useCountry: true,
          });

          console.log(`📍 Tier 2: ${sameState.length} profiles in ${state}`);

          addProfiles(sameState, 2);
        }

        // --------------------------------------------------------------
        // TIER 3
        // Same country + age ±5
        // --------------------------------------------------------------
        if (selectedProfiles.length < 12 && country) {
          const sameCountry = await fetchProfiles({
            useCountry: true,
          });

          console.log(
            `🌎 Tier 3: ${sameCountry.length} profiles in ${country}`,
          );

          addProfiles(sameCountry, 3);
        }

        // --------------------------------------------------------------
        // TIER 4
        // Same country + broader age range
        // --------------------------------------------------------------
        if (selectedProfiles.length < 12 && country) {
          const broaderMinAge = Math.max(18, memberAge - 10);
          const broaderMaxAge = Math.min(99, memberAge + 10);

          const broaderCountry = await fetchProfiles({
            useCountry: true,
            minAgeValue: broaderMinAge,
            maxAgeValue: broaderMaxAge,
          });

          console.log(
            `🌎 Tier 4: broader age range found ${broaderCountry.length}`,
          );

          addProfiles(broaderCountry, 4);
        }

        // --------------------------------------------------------------
        // TIER 5
        // Last resort: any active profile
        // --------------------------------------------------------------
        if (selectedProfiles.length < 12) {
          const { data, error } = await supabase
            .from("fictional_profiles")
            .select("*")
            .neq("id", member.id)
            .eq("is_deleted", false)
            .limit(50);

          if (error) throw error;

          const fallbackProfiles = (data || [])
            .map(normalizeProfile)
            .filter(Boolean);

          console.log(
            `🌍 Tier 5: fallback profiles found ${fallbackProfiles.length}`,
          );

          addProfiles(fallbackProfiles, 5);
        }

        // --------------------------------------------------------------
        // RANK BY INTERESTS
        // --------------------------------------------------------------
        const memberInterests = (member.interests || []).map((interest) =>
          String(interest).toLowerCase().trim(),
        );

        selectedProfiles.forEach((profile) => {
          const profileInterests = (profile.interests || []).map((interest) =>
            String(interest).toLowerCase().trim(),
          );

          const commonInterests = profileInterests.filter((interest) =>
            memberInterests.includes(interest),
          ).length;

          profile._interestScore = commonInterests;

          // Location tier is more important than interests.
          // Lower tier = better location match.
          profile._finalScore =
            (6 - profile._relatedTier) * 100 + commonInterests * 10;
        });

        // --------------------------------------------------------------
        // SORT
        // --------------------------------------------------------------
        selectedProfiles.sort((a, b) => {
          return b._finalScore - a._finalScore;
        });

        // --------------------------------------------------------------
        // Randomize profiles with exactly the same score
        // --------------------------------------------------------------
        const grouped = [];

        let currentGroup = [];
        let currentScore = null;

        selectedProfiles.forEach((profile) => {
          if (currentScore === null || profile._finalScore === currentScore) {
            currentGroup.push(profile);
          } else {
            grouped.push(currentGroup);
            currentGroup = [profile];
          }

          currentScore = profile._finalScore;
        });

        if (currentGroup.length) {
          grouped.push(currentGroup);
        }

        const finalProfiles = grouped.flatMap((group) =>
          group.sort(() => Math.random() - 0.5),
        );

        // --------------------------------------------------------------
        // Remove temporary fields
        // --------------------------------------------------------------
        finalProfiles.forEach((profile) => {
          delete profile._relatedTier;
          delete profile._interestScore;
          delete profile._finalScore;
        });

        const result = finalProfiles.slice(0, 12);

        console.log(
          `✅ Showing ${result.length} related profiles for ${member.display_name}`,
        );

        if (active) {
          setRelatedProfiles(result);
        }
      } catch (err) {
        console.error("❌ Error fetching related profiles:", err);

        if (active) {
          setRelatedProfiles([]);
        }
      } finally {
        if (active) {
          setLoadingRelated(false);
        }
      }
    }

    fetchRelated();

    return () => {
      active = false;
    };
  }, [member]);
  // --------------------------------------------------------------------
  // 4. Handle message button: find or create conversation
  // --------------------------------------------------------------------
  const handleMessage = async () => {
    if (!currentUser) {
      navigate("/sign-up", { state: { from: location.pathname } });
      return;
    }

    if (!member || !profile) return;

    try {
      // 🔍 check existing conversation
      const { data, error } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", profile.id) // ✅ FIXED HERE
        .eq("fictional_profile_id", member.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        navigate(`/chat/${data.id}`);
        return;
      }

      // 🆕 create conversation
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: profile.id, // ✅ FIXED HERE
          fictional_profile_id: member.id,
          is_favorite: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      navigate(`/chat/${newConv.id}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  };
  // --------------------------------------------------------------------
  // Quick Flirt: send a flirt message to the member
  // --------------------------------------------------------------------
  const flirtMessages = [
    "🔥 Ready for fun?",
    "💕 You look amazing",
    "😉 Want to chat?",
    "🍆 Let's get naughty?",
    "💋 Can't stop thinking about you",
    "😏 You caught my eye",
    "💦 Let's cum together",
  ];

  const sendQuickFlirt = async (text) => {
    if (sendingFlirt) return; // Prevent multiple clicks

    setSendingFlirt(text);
    if (!currentUser) {
      navigate("/sign-up", {
        state: { from: location.pathname },
      });
      return;
    }

    if (!member || !profile) return;

    try {
      // Check credits first
      if (credits <= 0) {
        setShowOutOfCreditsModal(true);
        return;
      }

      // Check existing conversation
      const { data: existingConversation, error: fetchError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", profile.id)
        .eq("fictional_profile_id", member.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let conversationId;

      // Create conversation if it doesn't exist
      if (!existingConversation) {
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            user_id: profile.id,
            fictional_profile_id: member.id,
            is_favorite: false,
            started_by_flirt: true,
          })
          .select()
          .single();

        if (createError) throw createError;

        conversationId = newConversation.id;
      } else {
        conversationId = existingConversation.id;
      }

      // Send flirt message using SAME RPC as chat
      const { error: rpcError } = await supabase.rpc(
        "send_message_with_credits",
        {
          p_conversation_id: conversationId,
          p_sender_type: "real_user",
          p_sender_user_id: profile.id,
          p_content: text,
          p_image_url: null,
          p_direction: "user_to_fictional",
          p_credit_cost: 1,
        },
      );

      if (rpcError) {
        console.error("Quick flirt RPC error:", rpcError);

        if (rpcError.message?.includes("Insufficient credits")) {
          setShowOutOfCreditsModal(true);
        }

        return;
      }

      await loadCredits(profile.id);

      setLastFlirtConversationId(conversationId);
      setShowFlirtSuccess(true);

      // Optional:
      // navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error("Quick flirt failed:", err);
    } finally {
      setSendingFlirt(null);
    }
  };

  const formatHeight = (height) => {
    if (!height) return null;

    const feet = Math.floor(height / 12);
    const inches = height % 12;

    return `${feet}' ${inches}"`;
  };

  // Navigate to credits page and close modals
  function goToCredits() {
    setShowLowCreditModal(false);
    setShowOutOfCreditsModal(false);
    navigate("/credits");
  }

  // --------------------------------------------------------------------
  // Loading & Error States
  // --------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09080a] pt-24 px-4">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-[68vh] min-h-[520px] rounded-[2rem] bg-white/5 border border-white/10" />
          <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-6 mt-6">
            <div className="h-72 rounded-3xl bg-white/5 border border-white/10" />
            <div className="h-72 rounded-3xl bg-white/5 border border-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09080a] text-white px-4">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5 text-2xl">
            ♡
          </div>
          <h1 className="text-2xl font-semibold mb-2">Profile unavailable</h1>
          <p className="text-white/55 mb-6">
            {error ?? "This profile could not be found."}
          </p>
          <button
            onClick={() => navigate("/members")}
            className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
            style={{
              backgroundImage: "linear-gradient(135deg,#8b4b6b,#d4a574)",
            }}
          >
            Back to members
          </button>
        </div>
      </div>
    );
  }

  const locationText = [member.city, member.state, member.country]
    .filter(Boolean)
    .join(", ");
  const detailRows = [
    ["Relationship", member.relationship || "—"],
    ["Height", formatHeight(member.height) || "—"],
    ["Body type", member.body_type || "—"],
    ["Hair", member.hair_colour || "—"],
    ["Eyes", member.eye_colour || "—"],
    ["Tattoo", member.tattoo === null ? "—" : member.tattoo ? "Yes" : "No"],
    [
      "Piercing",
      member.piercing === null ? "—" : member.piercing ? "Yes" : "No",
    ],
    ["Smoker", member.smoker === null ? "—" : member.smoker ? "Yes" : "No"],
  ];

  return (
    <div className="min-h-screen bg-[#09080a] text-white pt-16">
      {/* Premium hero */}
      <section className="relative min-h-[78vh] lg:min-h-[86vh] overflow-hidden">
        <img
          src={member.image_url}
          alt={member.display_name}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09080a] via-black/35 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 sm:left-8 z-20 w-11 h-11 rounded-full bg-black/35 backdrop-blur-xl border border-white/15 flex items-center justify-center hover:bg-black/55 transition"
          aria-label="Go back"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[78vh] lg:min-h-[86vh] flex items-end pb-10 sm:pb-14">
          <div className="w-full max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-xl border border-white/15 text-xs sm:text-sm text-white/80 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Profile
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-none">
              {member.display_name}
              <span className="text-[#d4a574]">, {member.age}</span>
            </h1>
            {locationText && (
              <p className="mt-4 text-white/75 flex items-center gap-2 text-sm sm:text-base">
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
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {locationText}
              </p>
            )}

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleMessage}
                className="sm:w-52 py-3.5 px-6 rounded-2xl font-semibold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                style={{
                  backgroundImage: "linear-gradient(135deg,#8b4b6b,#d4a574)",
                }}
              >
                Message {member.display_name}
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("profile-details")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="sm:w-44 py-3.5 px-6 rounded-2xl font-medium bg-white/10 backdrop-blur-xl border border-white/15 hover:bg-white/15 transition"
              >
                View profile
              </button>
            </div>
          </div>
        </div>
      </section>

      <main
        id="profile-details"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
      >
        {/* Quick flirt */}
        <section className="-mt-1 relative z-20 rounded-3xl border border-white/10 bg-[#111013]/95 backdrop-blur-xl p-5 sm:p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="lg:w-48 shrink-0">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4a574] font-semibold">
                Break the ice
              </p>
              <h2 className="text-xl font-semibold mt-1">Quick Flirt</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:flex-wrap">
              {flirtMessages.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuickFlirt(msg)}
                  disabled={sendingFlirt !== null}
                  className={`shrink-0 px-4 py-2.5 rounded-xl border text-sm transition ${sendingFlirt === msg ? "border-[#d4a574]/40 bg-[#d4a574]/10 text-[#d4a574]" : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:border-white/20"}`}
                >
                  {sendingFlirt === msg ? "Sending…" : msg}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-6 mt-6">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-[#d4a574]" />
                <h2 className="text-2xl font-semibold">
                  About {member.display_name}
                </h2>
              </div>
              <p className="text-white/72 leading-7">
                {member.bio || "No bio provided."}
              </p>
              {member.about && (
                <p className="text-white/55 leading-7 mt-4 pt-4 border-t border-white/8">
                  {member.about}
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-semibold">Photos</h2>
                <span className="text-xs text-white/40">
                  {member.previewImages?.length || 0} photos
                </span>
              </div>
              {member.previewImages?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {member.previewImages.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      onClick={() => setActiveImage(img)}
                      className={`group relative overflow-hidden rounded-2xl bg-white/5 ${index === 0 ? "col-span-2 sm:col-span-2 row-span-2" : ""}`}
                    >
                      <img
                        src={img}
                        alt={`${member.display_name} ${index + 1}`}
                        loading="lazy"
                        className={`w-full object-cover transition duration-500 group-hover:scale-105 ${index === 0 ? "h-72 sm:h-[390px]" : "h-40 sm:h-[190px]"}`}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-white/45">No additional photos yet.</p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-5">Profile details</h2>
              <div className="divide-y divide-white/[0.07]">
                {detailRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-white/45">{label}</span>
                    <span className="text-sm text-white/85 text-right font-medium">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-5 mt-2 border-t border-white/[0.07]">
                <p className="text-sm text-white/45 mb-3">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {member.interests?.length ? (
                    member.interests.map((interest, index) => (
                      <span
                        key={`${interest}-${index}`}
                        className="px-3 py-1.5 rounded-full bg-[#8b4b6b]/15 border border-[#8b4b6b]/25 text-sm text-white/75"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-white/50">
                      No interests listed
                    </span>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Related profiles */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4a574] font-semibold mb-2">
                Discover more
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold">
                You might also like
              </h2>
            </div>
            <button
              onClick={() => navigate("/members")}
              className="text-sm text-white/55 hover:text-white transition"
            >
              View all →
            </button>
          </div>
          {loadingRelated ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
                />
              ))}
            </div>
          ) : relatedProfiles.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProfiles.slice(0, 8).map((profile) => (
                <button
                  key={profile.id}
                  onClick={() =>
                    navigate(`/profile/${profile.id}`, {
                      state: { member: profile },
                    })
                  }
                  className="text-left group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.035] hover:border-white/20 transition"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        profile.image_url ||
                        "https://via.placeholder.com/400x500?text=Profile"
                      }
                      alt={profile.display_name}
                      loading="lazy"
                      className="w-full h-56 sm:h-72 object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">
                      {profile.display_name}, {profile.age}
                    </h3>
                    <p className="text-white/45 text-xs mt-1 truncate">
                      {[profile.city, profile.state]
                        .filter(Boolean)
                        .join(", ") || profile.country}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-12 text-center text-white/45">
              No similar profiles found at the moment.
            </div>
          )}
        </section>
      </main>

      {showFlirtSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#151317] rounded-3xl p-7 w-full max-w-sm text-center border border-white/10 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#8b4b6b]/20 flex items-center justify-center mx-auto mb-4 text-2xl">
              💕
            </div>
            <h3 className="text-xl font-semibold mb-2">Flirt sent</h3>
            <p className="text-white/55 mb-6">
              Your message was sent to {member.display_name}.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowFlirtSuccess(false)}
                className="py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                Keep browsing
              </button>
              <button
                onClick={() => navigate(`/chat/${lastFlirtConversationId}`)}
                className="py-3 rounded-xl font-semibold"
                style={{
                  backgroundImage: "linear-gradient(135deg,#8b4b6b,#d4a574)",
                }}
              >
                View chat
              </button>
            </div>
          </div>
        </div>
      )}

      {showLowCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#151317] rounded-3xl p-7 w-full max-w-sm text-center border border-white/10">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Low credits</h3>
            <p className="text-white/55 mb-6">
              You have{" "}
              <span className="text-[#d4a574] font-semibold">{credits}</span>{" "}
              credits left.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLowCreditModal(false)}
                className="py-3 rounded-xl border border-white/10"
              >
                Dismiss
              </button>
              <button
                onClick={goToCredits}
                className="py-3 rounded-xl font-semibold"
                style={{
                  backgroundImage: "linear-gradient(135deg,#8b4b6b,#d4a574)",
                }}
              >
                Buy credits
              </button>
            </div>
          </div>
        </div>
      )}

      {showOutOfCreditsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#151317] rounded-3xl p-7 w-full max-w-sm text-center border border-white/10">
            <div className="text-3xl mb-3">♡</div>
            <h3 className="text-xl font-semibold mb-2">Out of credits</h3>
            <p className="text-white/55 mb-6">
              You need at least 1 credit to send a message.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowOutOfCreditsModal(false)}
                className="py-3 rounded-xl border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={goToCredits}
                className="py-3 rounded-xl font-semibold"
                style={{
                  backgroundImage: "linear-gradient(135deg,#8b4b6b,#d4a574)",
                }}
              >
                Buy credits
              </button>
            </div>
          </div>
        </div>
      )}

      {activeImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setActiveImage(null)}
        >
          <button
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={activeImage}
            alt={`${member.display_name} full size`}
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
