import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ArrowLeft } from "lucide-react";

export default function Chat() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const [fictionalName, setFictionalName] = useState("");
  const [fictionalImage, setFictionalImage] = useState("");
  const [fictionalState, setFictionalState] = useState("");
  const [fictionalCity, setFictionalCity] = useState("");
  const [fictionalAge, setFictionalAge] = useState("");
  const [recipientId, setRecipientId] = useState(null);

  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [blockChecked, setBlockChecked] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  // Credit warning modals
  const [showLowCreditModal, setShowLowCreditModal] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [lowCreditThreshold] = useState(10); // Show warning when credits < 10

  // Track if low credit warning has been shown to avoid spamming
  const [lowCreditWarningShown, setLowCreditWarningShown] = useState(false);

  /* ---------------- Load user profile ---------------- */
  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      const { data } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", auth.user.id)
        .single();

      if (data) setProfileId(data.id);
    }
    loadProfile();
  }, []);

  // ****************************
  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ---------------- Credits ---------------- */
  async function loadCredits(pid = profileId) {
    if (!pid) return;
    const { data } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", pid)
      .single();
    if (data) {
      const newBalance = data.balance;
      setCredits(newBalance);

      // Check for low credit warning (only if not already shown and user has > 0 credits)
      if (
        !lowCreditWarningShown &&
        newBalance > 0 &&
        newBalance < lowCreditThreshold
      ) {
        setShowLowCreditModal(true);
        setLowCreditWarningShown(true);
      }

      // Reset warning flag if credits go back above threshold
      if (newBalance >= lowCreditThreshold) {
        setLowCreditWarningShown(false);
      }
    }
  }

  useEffect(() => {
    if (profileId) loadCredits(profileId);
  }, [profileId]);

  /* ---------------- Conversation meta & block status (runs on mount and when IDs change) ---------------- */
  useEffect(() => {
    if (!conversationId || !profileId) return;

    let isMounted = true;

    async function loadMeta() {
      // Fetch conversation with fictional profile
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          fictional_profile_id,
          fictional_profiles (
            id,
            display_name, 
            image_url, 
            state, 
            city, 
            age
          )
        `,
        )
        .eq("id", conversationId)
        .single();

      if (error) {
        console.error("Meta error:", error);
        if (isMounted) setLoading(false);
        return;
      }

      if (data && isMounted) {
        const fictionalProfile = data.fictional_profiles;
        const fictionalId = data.fictional_profile_id || fictionalProfile?.id;

        setFictionalName(fictionalProfile?.display_name || "");
        setFictionalImage(fictionalProfile?.image_url || "");
        setFictionalState(fictionalProfile?.state || "");
        setFictionalCity(fictionalProfile?.city || "");
        setFictionalAge(fictionalProfile?.age || "");
        setRecipientId(fictionalId);

        // Check block status from DB
        if (fictionalId && profileId) {
          const { data: blockData } = await supabase
            .from("blocked_profiles")
            .select("id")
            .eq("user_profile_id", profileId)
            .eq("blocked_fictional_id", fictionalId)
            .maybeSingle();

          console.log("BLOCK CHECK:", {
            profileId,
            fictionalId,
          });

          setIsBlocked(!!blockData);
          setBlockChecked(true);
        }
        setLoading(false);
      }
    }

    loadMeta();

    return () => {
      isMounted = false;
    };
  }, [conversationId, profileId]); // Re-run when conversationId or profileId changes (including refresh)

  /* ---------------- Fetch messages ---------------- */
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });

      if (profileId) {
        await supabase.from("conversation_reads").upsert({
          conversation_id: conversationId,
          user_id: profileId,
          last_read_at: new Date().toISOString(),
        });
      }
    }
  }, [conversationId, profileId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /* ---------------- Realtime new messages (with block filter) ---------------- */
  useEffect(() => {
    if (!conversationId || !profileId || !recipientId) return;

    console.log("SUBSCRIBING TO:", {
      conversationId,
      profileId,
      recipientId,
    });

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("MESSAGE EVENT:", payload);
          const newMsg = payload.new;

          // // ✅ ALWAYS CHECK DB (never trust state)
          // const { data: blockExists } = await supabase
          //   .from("blocked_profiles")
          //   .select("id")
          //   .eq("user_profile_id", profileId) // ✅ matches your schema
          //   .eq("blocked_fictional_id", recipientId)
          //   .maybeSingle();

          // if (blockExists) {
          //   console.log("🚫 Blocked message prevented");
          //   return;
          // }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        },
      )
      .subscribe((status) => {
        console.log("CHAT REALTIME STATUS:", status);

        console.log(
          "ACTIVE CHANNELS:",
          supabase.getChannels().map((c) => c.topic),
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, profileId, recipientId]);

  // ****************************
  useEffect(() => {
    const testChannel = supabase
      .channel("realtime-test")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("🔥 TEST EVENT:", payload);
        },
      )
      .subscribe((status) => {
        console.log("🔥 TEST STATUS:", status);
      });

    return () => {
      supabase.removeChannel(testChannel);
    };
  }, []);

  /* ---------------- Block handler ---------------- */
  async function handleBlockProfile() {
    if (!recipientId) {
      alert("Unable to block: recipient not found");
      return;
    }

    // Check if already blocked
    const { data: existing } = await supabase
      .from("blocked_profiles")
      .select("id")
      .eq("user_profile_id", profileId)
      .eq("blocked_fictional_id", recipientId)
      .maybeSingle();

    if (existing) {
      alert(`You have already blocked ${fictionalName}.`);
      setShowMenu(false);
      return;
    }

    const confirmBlock = window.confirm(
      `Block ${fictionalName}? You will no longer receive messages from them.`,
    );
    if (!confirmBlock) return;

    setBlocking(true);
    try {
      const { error } = await supabase.from("blocked_profiles").insert({
        user_profile_id: profileId,
        blocked_fictional_id: recipientId,
        blocked_at: new Date().toISOString(),
      });

      if (error) throw error;

      setIsBlocked(true);
      setInput("");
      removeImage();
      alert(`✅ ${fictionalName} has been blocked.`);
      setShowMenu(false);
    } catch (err) {
      console.error("Block error:", err);
      alert(`Failed to block: ${err.message}`);
    } finally {
      setBlocking(false);
    }
  }

  async function handleReportProfile() {
    if (!recipientId) {
      alert("Unable to report: recipient not found");
      return;
    }

    const reason = prompt(
      "Please provide a reason for reporting this profile:",
    );
    if (!reason || reason.trim() === "") return;

    setReporting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_profile_id: profileId,
        reported_fictional_id: recipientId,
        reason: reason.trim(),
        reported_at: new Date().toISOString(),
        status: "pending",
      });

      if (error) throw error;

      alert(`✅ Thank you. We've received your report about ${fictionalName}.`);
      setShowMenu(false);
    } catch (err) {
      console.error("Report error:", err);
      alert(`Failed to submit report: ${err.message}`);
    } finally {
      setReporting(false);
    }
  }

  async function handleUnblock() {
    if (!profileId || !recipientId) return;

    const confirmUnblock = window.confirm(
      `Unblock ${fictionalName}? You will be able to message them again.`,
    );
    if (!confirmUnblock) return;

    try {
      const { error } = await supabase
        .from("blocked_profiles")
        .delete()
        .eq("user_profile_id", profileId)
        .eq("blocked_fictional_id", recipientId);

      if (error) throw error;

      setIsBlocked(false);
      alert(`✅ ${fictionalName} has been unblocked.`);
    } catch (err) {
      console.error("Unblock error:", err);
      alert(`Failed to unblock: ${err.message}`);
    }
  }

  /* ---------------- Image handlers ---------------- */
  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return alert("Select an image");
    if (file.size > 5 * 1024 * 1024) return alert("Max 5MB");

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ---------------- Send message (with block check and credit check) ---------------- */
  async function sendMessage() {
    // Prevent duplicate sends
    if (sending) return;

    // Prevent empty sends
    if ((!input.trim() && !imageFile) || !conversationId) return;

    // Block check
    if (isBlocked || !blockChecked) {
      alert("You have blocked this profile. Unblock to send messages.");
      return;
    }

    // Credit check
    if (credits <= 0) {
      setShowOutOfCreditsModal(true);
      return;
    }

    try {
      setSending(true);

      // Save values BEFORE clearing state
      const messageText = input.trim();
      const currentImage = imageFile;

      // Clear UI immediately for smoother experience
      setInput("");

      // Reset textarea height immediately
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }

      // Remove selected image preview immediately
      if (currentImage) {
        removeImage();
      }

      // Extra safety block check from DB
      if (profileId && recipientId) {
        const { data: blockExists } = await supabase
          .from("blocked_profiles")
          .select("id")
          .eq("user_profile_id", profileId)
          .eq("blocked_fictional_id", recipientId)
          .maybeSingle();

        if (blockExists) {
          alert("You have blocked this profile. Unblock to send messages.");
          setIsBlocked(true);
          return;
        }
      }

      // Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated");
        return;
      }

      let imageUrl = null;

      /* ---------------- IMAGE UPLOAD ---------------- */
      if (currentImage) {
        try {
          const originalName = currentImage.name;
          const fileExt = originalName.split(".").pop();

          let baseName = originalName.slice(0, originalName.lastIndexOf("."));

          // Sanitize filename
          baseName = baseName.replace(/[^a-zA-Z0-9]/g, "_");
          baseName = baseName.substring(0, 50);

          const fileName = `${Date.now()}-${baseName}.${fileExt}`;
          const path = `${conversationId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("Chat-images")
            .upload(path, currentImage, {
              cacheControl: "3600",
              upsert: false,
              contentType: currentImage.type,
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);

            // Restore message if upload failed
            setInput(messageText);

            alert(
              "Failed to upload image. Please try again with a different file.",
            );

            return;
          }

          const { data } = supabase.storage
            .from("Chat-images")
            .getPublicUrl(path);

          imageUrl = data.publicUrl;

          // Save image reference
          await supabase.from("message_images").insert({
            sender_id: user.id,
            recipient_id: recipientId,
            conversation_id: conversationId,
            image_url: imageUrl,
          });
        } catch (uploadErr) {
          console.error("Upload exception:", uploadErr);

          // Restore message
          setInput(messageText);

          alert("Error uploading image. Please try again.");

          return;
        }
      }

      /* ---------------- SEND MESSAGE RPC ---------------- */

      const CREDIT_COST = 1;

      const { error } = await supabase.rpc("send_message_with_credits", {
        p_conversation_id: conversationId,
        p_sender_type: "real_user",
        p_sender_user_id: profileId,
        p_content: messageText || null,
        p_image_url: imageUrl,
        p_direction: "user_to_fictional",
        p_credit_cost: CREDIT_COST,
      });

      if (error) {
        console.error("RPC send error:", error);

        // Restore text if failed
        setInput(messageText);

        if (error.message?.includes("Insufficient credits")) {
          setShowOutOfCreditsModal(true);
        } else {
          alert("Failed to send message");
        }

        return;
      }

      /* ---------------- UPDATE CONVERSATION PREVIEW ---------------- */

      const messagePreview = messageText
        ? messageText.substring(0, 50)
        : currentImage
          ? "📷 Sent a photo"
          : null;

      if (messagePreview) {
        const { error: updateConvError } = await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            last_message_sender_id: profileId,
            last_message_preview: messagePreview,
          })
          .eq("id", conversationId);

        if (updateConvError) {
          console.error(
            "Failed to update conversation last message:",
            updateConvError,
          );
        }
      }

      /* ---------------- MARK AS READ ---------------- */

      await supabase.from("conversation_reads").upsert({
        conversation_id: conversationId,
        user_id: profileId,
        last_read_at: new Date().toISOString(),
      });

      /* ---------------- REFRESH DATA ---------------- */

      await Promise.all([fetchMessages(), loadCredits()]);
    } catch (err) {
      console.error("Send message error:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  }
  // Navigate to credits page and close modals
  function goToCredits() {
    setShowLowCreditModal(false);
    setShowOutOfCreditsModal(false);
    navigate("/credits");
  }

  if (loading || !blockChecked) {
    return (
      <div className="flex justify-center items-center p-6 h-full">
        <svg
          className="animate-spin h-6 w-6 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="h-[90dvh] flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-primary/10 bg-primary/10">
        <div className="p-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/chat")}
            className="md:hidden flex-shrink-0 rounded-full w-8 h-8 hover:bg-black/5"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="relative flex-shrink-0">
            <img
              src={fictionalImage || "/default-avatar.png"}
              alt={fictionalName}
              onClick={() => setActiveImage(fictionalImage)}
              className="w-12 h-12 rounded-full object-cover cursor-pointer"
              loading="lazy"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 truncate">
                {fictionalName || "Unknown"}, {fictionalAge || "?"}
              </span>
              {isBlocked && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  Blocked
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 truncate">
              {fictionalState || "No State"}, {fictionalCity || "No City"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">
              Credits:{" "}
              <span
                className={`${credits < lowCreditThreshold && credits > 0 ? "text-orange-500" : "text-primary"}`}
              >
                {credits}
              </span>
            </p>
          </div>

          <button
            onClick={() => navigate("/credits")}
            className="px-3 py-1.5 bg-primary text-white rounded-lg hover:opacity-90 transition text-xs font-medium"
          >
            Add
          </button>

          {recipientId && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full hover:bg-black/5 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-36 bg-primary rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleBlockProfile();
                      }}
                      disabled={blocking}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2"
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
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                      {blocking ? "Blocking..." : "Block Profile"}
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleReportProfile();
                      }}
                      disabled={reporting}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition flex items-center gap-2"
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      {reporting ? "Reporting..." : "Report Profile"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg) => {
          const isUser = msg.sender_type === "real_user";
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-md rounded-2xl shadow-sm overflow-hidden ${
                  isUser
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-primary/10 text-black rounded-bl-sm"
                }`}
              >
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    onClick={() => setActiveImage(msg.image_url)}
                    className="w-full rounded-t-2xl cursor-pointer"
                    alt="attachment"
                  />
                )}
                {msg.content && <div className="px-4 py-2">{msg.content}</div>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area – conditional */}
      {isBlocked ? (
        <div className="shrink-0 p-4 bg-red-50 border-t border-red-200 text-center">
          <p className="text-red-600 mb-2">
            You have blocked {fictionalName}. You cannot send messages.
          </p>
          <button
            onClick={handleUnblock}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition"
          >
            Unblock Profile
          </button>
        </div>
      ) : (
        <div className="p-1 border-primary/10 bg-surface">
          {imagePreview && (
            <div className="mb-3 p-3 bg-primary/10 h-28 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Image to send</span>
                <button
                  onClick={removeImage}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-red-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 max-w-xs max-h-16 rounded-md object-cover"
              />
            </div>
          )}

          <div className="border-t bg-primary/10 pt-3 px-3 pb-3">
            <div className="flex gap-2 items-center">
              {/* Emoji Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    const emojiPicker = document.getElementById("emoji-picker");
                    if (emojiPicker) {
                      emojiPicker.style.display =
                        emojiPicker.style.display === "none" ? "flex" : "none";
                    }
                  }}
                  type="button"
                  className="p-2 rounded-full hover:bg-black/5 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                {/* Emoji Picker Dropdown */}
                <div
                  id="emoji-picker"
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 w-64 z-50 hidden"
                  style={{ display: "none" }}
                >
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    {[
                      "😀",
                      "😂",
                      "😍",
                      "🤣",
                      "😊",
                      "😉",
                      "😎",
                      "😢",
                      "😡",
                      "👍",
                      "❤️",
                      "🔥",
                      "🎉",
                      "✨",
                      "💀",
                      "👋",
                      "🙏",
                      "💯",
                      "🔞",
                      "🍆",
                      "💦",
                      "👅",
                      "💋",
                      "🌹",
                      "💔",
                      "😘",
                      "🥰",
                      "😈",
                      "🤔",
                      "😴",
                      "🥺",
                      "😱",
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setInput((prev) => prev + emoji);
                          document.getElementById(
                            "emoji-picker",
                          ).style.display = "none";
                        }}
                        className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Camera/Image Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                📷
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                placeholder="Type a message..."
                onChange={(e) => {
                  setInput(e.target.value);

                  e.target.style.height = "44px";
                  e.target.style.height = `${Math.min(
                    e.target.scrollHeight,
                    120,
                  )}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();

                    if (!sending) {
                      sendMessage();
                    }
                  }
                }}
                className="
                    form-input
                    flex-1
                    border
                    border-primary
                    rounded-2xl
                    px-4
                    py-3
                    resize-none
                    overflow-y-auto
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary
                    min-h-[44px]
                    max-h-[120px]
                  "
              />

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={sending || (!input.trim() && !imageFile)}
                className={`p-2 rounded-full transition-all duration-300 ${
                  input.trim() || imageFile
                    ? "bg-primary text-white hover:opacity-90"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } ${sending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg
                  className="w-5 h-5 transform rotate-45"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setActiveImage(null)}
        >
          <img
            src={activeImage}
            alt="preview"
            className="max-w-[90vw] max-h-[90vh] border border-white rounded-lg"
          />
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
    </div>
  );
}
