// **************************************** New Matters *************************
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { LoveSpinner } from "../components/Spinner";

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
        const minAge = member.age ? member.age - 5 : 18;
        const maxAge = member.age ? member.age + 5 : 99;

        // STEP 1:
        // Get profiles in same country + similar age
        let query = supabase
          .from("fictional_profiles")
          .select("*")
          .neq("id", member.id)
          .eq("is_deleted", false)
          .gte("age", minAge)
          .lte("age", maxAge)
          .eq("country", member.country)
          .limit(30);

        const { data, error } = await query;

        if (error) throw error;

        let profiles = (data || []).map(normalizeProfile).filter(Boolean);

        // STEP 2:
        // Smart ranking system
        profiles.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          // Same city = highest priority
          if (a.city?.toLowerCase() === member.city?.toLowerCase()) {
            scoreA += 5;
          }

          if (b.city?.toLowerCase() === member.city?.toLowerCase()) {
            scoreB += 5;
          }

          // Same state
          if (a.state?.toLowerCase() === member.state?.toLowerCase()) {
            scoreA += 3;
          }

          if (b.state?.toLowerCase() === member.state?.toLowerCase()) {
            scoreB += 3;
          }

          // Similar interests
          const memberInterests = member.interests || [];

          const commonA =
            a.interests?.filter((i) => memberInterests.includes(i)).length || 0;

          const commonB =
            b.interests?.filter((i) => memberInterests.includes(i)).length || 0;

          scoreA += commonA;
          scoreB += commonB;

          return scoreB - scoreA;
        });

        // STEP 3:
        // Shuffle slightly so it doesn't look repetitive
        profiles = profiles.sort(() => Math.random() - 0.5);

        // STEP 4:
        // Show only 6
        profiles = profiles.slice(0, 6);

        if (active) {
          setRelatedProfiles(profiles);
        }
      } catch (err) {
        console.error("Error fetching related profiles:", err);
      } finally {
        if (active) setLoadingRelated(false);
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

      // Update conversation preview
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_sender_id: profile.id,
          last_message_preview: text,
        })
        .eq("id", conversationId);

      setLastFlirtConversationId(conversationId);
      setShowFlirtSuccess(true);

      await loadCredits(profile.id);

      // Optional:
      // navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error("Quick flirt failed:", err);
    } finally {
      setSendingFlirt(null);
    }
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
      <div className="min-h-screen flex items-center justify-center text-white">
        <LoveSpinner size="large" color="#ff6b6b" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <p>{error ?? "Profile not found"}</p>
        <button
          onClick={() => navigate("/members")}
          className="mt-4 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition"
        >
          Back to members
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <div className="pt-16 min-h-screen bg-background">
      <section className="relative min-h-screen overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img
            src={member.image_url}
            alt={member.display_name}
            className="w-full h-full object-cover  "
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="relative z-10 p-8 max-w-5xl mx-auto h-full flex flex-col justify-end">
          <h1 className="text-5xl text-primary font-bold">
            {member.display_name}, {member.age}
          </h1>
          <p className="mt-2 text-white/80">
            {[member.city, member.state, member.country]
              .filter(Boolean)
              .join(", ")}
          </p>

          <button
            onClick={handleMessage}
            className="mt-6 w-48 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition"
            style={{
              backgroundImage: "linear-gradient(to right, #8b4b6b, #d4a574)",
            }}
          >
            Message
          </button>

          <div className="flex flex-wrap gap-2 mt-4">
            <h2 className="text-3xl text-white font-semibold mb-2">
              Quick Flirt
            </h2>
            <br />

            {flirtMessages.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => sendQuickFlirt(msg)}
                disabled={sendingFlirt !== null}
                className={`px-4 py-2 rounded-full text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  sendingFlirt === msg
                    ? "opacity-80 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #8b4b6b, #d4a574)",
                }}
              >
                {sendingFlirt === msg ? (
                  <>
                    <svg
                      className="w-4 h-4 items-center animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  msg
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Two‑column layout for Bio/About (left) and Preferences (right) */}
        <div className="relative max-w-5xl mx-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <section>
                <h2 className="text-3xl text-white font-semibold mb-2">Bio</h2>
                <p className="text-white/80">
                  {member.bio || "No bio provided."}
                </p>
              </section>

              <section>
                <h2 className="text-3xl text-white font-semibold mb-2">
                  About
                </h2>
                <p className="text-white/80">
                  {member.about || "No additional details."}
                </p>
              </section>

              <div className="mt-6  max-w-5xl mx-auto">
                <h2 className="text-3xl font-semibold mb-3 text-white">
                  Photos
                </h2>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {member.previewImages?.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`preview-${index}`}
                      onClick={() => setActiveImage(img)}
                      className="w-28 h-36 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:scale-105 transition"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column – Preferences */}
            <div className="relative bg-black/30 rounded-lg p-6 border border-white/10 text-white/90">
              <h2 className="text-2xl font-semibold mb-4">Details</h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="font-semibold text-white">
                    Relationship:
                  </span>{" "}
                  <span className="text-white/80">
                    {member.relationship || "—"}
                  </span>
                </li>
                <li>
                  <span className="font-semibold text-white">Height:</span>{" "}
                  <span className="text-white/80">{member.height || "—"}</span>
                </li>
                <li>
                  <span className="font-semibold text-white">Body Type:</span>{" "}
                  <span className="text-white/80">
                    {member.body_type || "—"}
                  </span>
                </li>
                <li>
                  <span className="font-semibold text-white">Hair Color:</span>{" "}
                  <span className="text-white/80">
                    {member.hair_colour || "—"}
                  </span>
                </li>
                <li>
                  <span className="font-semibold text-white">Eye Color:</span>{" "}
                  <span className="text-white/80">
                    {member.eye_colour || "—"}
                  </span>
                </li>
                <li>
                  <span className="font-semibold text-white">Tattoo:</span>{" "}
                  <span className="text-white/80">
                    {member.tattoo === null
                      ? "—"
                      : member.tattoo
                        ? "Yes"
                        : "No"}
                  </span>
                </li>
                <li>
                  <span className="font-semibold text-white">Piercing:</span>{" "}
                  {member.piercing === null
                    ? "—"
                    : member.piercing
                      ? "Yes"
                      : "No"}
                </li>
                <li>
                  <span className="font-semibold text-white">Smoker:</span>{" "}
                  {member.smoker === null ? "—" : member.smoker ? "Yes" : "No"}
                </li>
              </ul>
              <h1 className="text-2xl pt-3">Interests:</h1>
              <span>
                {member.interests?.length
                  ? member.interests.join(", ")
                  : "No interest found"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {showFlirtSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-900 rounded-2xl p-6 w-[90%] max-w-sm text-center border border-pink-500/20">
            <h3 className="text-xl font-semibold text-white mb-3">
              Flirt Sent 💕
            </h3>

            <p className="text-white/70 mb-6">
              Your flirt message was sent successfully.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFlirtSuccess(false)}
                className="flex-1 py-2 rounded-lg  text-white hover:opacity-90 transition"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #8b4b6b, #d4a574)",
                }}
              >
                Continue Browsing
              </button>

              <button
                onClick={() => navigate(`/chat/${lastFlirtConversationId}`)}
                className="flex-1 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition"
              >
                View Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Credit Warning Modal */}
      {showLowCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-red-50 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-500"
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Low Credits!
              </h3>
              <p className="text-gray-600 mb-4">
                You only have{" "}
                <span className="font-bold text-orange-600">{credits}</span>{" "}
                credits left.
                {lowCreditThreshold - credits === 1
                  ? " This is your last credit!"
                  : ` You need at least 1 credit to send a message.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLowCreditModal(false)}
                  className="flex-1 px-4 py-2 border border-primary rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Dismiss
                </button>
                <button
                  onClick={goToCredits}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
                >
                  Buy Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Out of Credits Modal */}
      {showOutOfCreditsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-red-50 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8V4M8 4h8M4 4h16v12H4V4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Out of Credits!
              </h3>
              <p className="text-gray-600 mb-2">
                You don't have enough credits to send a message.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Each message costs <span className="font-medium">1 credit</span>
                .
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOutOfCreditsModal(false)}
                  className="flex-1 px-4 py-2 border border-primary rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={goToCredits}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
                >
                  Buy Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Profiles – below the two columns */}
      <div className="bg-black px-6 py-16">
        <h2 className="text-3xl text-white font-semibold mb-6">
          You might also like
        </h2>

        {loadingRelated ? (
          <div className="flex flex-col-2 justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : relatedProfiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {relatedProfiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-black rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() =>
                  navigate(`/profile/${profile.id}`, {
                    state: { member: profile },
                  })
                }
              >
                <img
                  src={
                    profile.image_url ||
                    "https://via.placeholder.com/400x300?text=Profile"
                  }
                  alt={profile.display_name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl text-white font-semibold">
                    {profile.display_name}, {profile.age}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {[profile.city, profile.state, profile.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/60 text-center py-12">
            No similar profiles found at the moment.
          </p>
        )}
      </div>

      {activeImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setActiveImage(null)}
        >
          <img
            src={activeImage}
            alt="full"
            className="w-80 h-80 border boreder-white rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
