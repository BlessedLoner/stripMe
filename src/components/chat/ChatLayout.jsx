import {
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { ChatListSkeleton } from "./ChatListSkeleton";
import { MessageSquare } from "lucide-react";

export default function ChatLayout() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();

  const profileId = searchParams.get("profile");

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [readMap, setReadMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [flirtConversations, setFlirtConversations] = useState([]);
  const [loadingFlirts, setLoadingFlirts] = useState(false);
  const [toast, setToast] = useState(null);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchTimeoutRef = useRef(null);

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ============================= */
  /* 1️⃣ Load Auth User */
  /* ============================= */

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Failed to load profile:", error);
          showToast("Failed to load your profile", "error");
          return;
        }

        setCurrentUser(profile);
      } catch (err) {
        console.error("Error loading profile:", err);
        showToast("Something went wrong", "error");
      }
    };

    loadProfile();
  }, []);

  /* ============================= */
  /* Fetch Flirt Conversations (for Flirt tab) */
  /* ============================= */
  const fetchFlirtConversations = useCallback(async () => {
    if (!currentUser) return;

    setLoadingFlirts(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          last_message_at,
          last_message_sender_id,
          last_message_preview,
          fictional_profiles (
            display_name,
            image_url
          ),
          messages!inner (
            id,
            content,
            created_at,
            is_flirt
          )
        `,
        )
        .eq("user_id", currentUser.id)
        .eq("messages.is_flirt", true)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      const formatted = (data || []).map((conv) => ({
        id: conv.id,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        fictional_profiles: conv.fictional_profiles,
        is_flirt_conversation: true,
      }));

      setFlirtConversations(formatted);
    } catch (err) {
      console.error("Error fetching flirt conversations:", err);
      showToast("Failed to load flirt conversations", "error");
    } finally {
      setLoadingFlirts(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchFlirtConversations();
    }
  }, [currentUser, fetchFlirtConversations]);

  /* =======================================================
     2️⃣ START CONVERSATION FROM PROFILE PAGE
  ======================================================= */

  const startConversation = useCallback(
    async (profileId) => {
      if (!profileId || !currentUser) return;

      try {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("fictional_profile_id", profileId)
          .maybeSingle();

        if (existing) {
          navigate(`/chat/${existing.id}`);
          return;
        }

        const { data: created, error } = await supabase
          .from("conversations")
          .insert({
            user_id: currentUser.id,
            fictional_profile_id: profileId,
            is_favorite: false,
          })
          .select()
          .single();

        if (error) throw error;

        navigate(`/chat/${created.id}`);
      } catch (err) {
        console.error("Start conversation error:", err);
        showToast("Failed to start conversation", "error");
      }
    },
    [currentUser, navigate],
  );

  useEffect(() => {
    if (profileId && currentUser) {
      startConversation(profileId);
    }
  }, [profileId, currentUser, startConversation]);

  /* ============================= */
  /* 2️⃣ Load Conversations + Reads
  /* ============================= */

  const loadConversations = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const { data: convs, error: convError } = await supabase
        .from("conversations")
        .select(
          `
          id,
          last_message_at,
          last_message_sender_id,
          last_message_preview,
          is_favorite,
          category,
          fictional_profiles (
            display_name,
            image_url,
            last_active_at
          )
        `,
        )
        .eq("user_id", currentUser.id)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convError) throw convError;

      if (!convs || convs.length === 0) {
        setConversations([]);
        return;
      }

      const { data: reads, error: readError } = await supabase
        .from("conversation_reads")
        .select("conversation_id, last_read_at")
        .eq("user_id", currentUser.id);

      if (readError) throw readError;

      const map = {};
      reads?.forEach((r) => {
        map[r.conversation_id] = r.last_read_at;
      });

      setReadMap(map);

      const merged = convs.map((c) => {
        let unread = 0;
        const lastMsgAt = c.last_message_at
          ? new Date(c.last_message_at)
          : null;
        const lastReadAt = map[c.id] ? new Date(map[c.id]) : null;

        const condition =
          lastMsgAt &&
          c.last_message_sender_id !== currentUser.id &&
          (!lastReadAt || lastMsgAt > lastReadAt);

        if (condition) unread = 1;

        return {
          ...c,
          unread_count: unread,
          last_read_at: map[c.id] || null,
        };
      });
      setConversations(merged);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError(err.message);
      showToast("Failed to load conversations", "error");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) loadConversations();
  }, [currentUser, loadConversations]);

  /* ============================= */
  /* 3️⃣ Real-Time Conversation Updates
  /* ============================= */
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("conversation-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        async (payload) => {
          const updated = payload.new;
          console.log("📡 Received conversation update:", updated);

          const senderId = updated.last_message_sender_id;
          if (!senderId) return;

          if (senderId !== currentUser.id) {
            const { data: blockCheck } = await supabase
              .from("blocked_profiles")
              .select("id")
              .eq("user_profile_id", currentUser.id)
              .eq("blocked_fictional_id", senderId)
              .maybeSingle();

            if (blockCheck) {
              console.log(
                `🚫 Blocked profile ${senderId} – conversation update ignored`,
              );
              return;
            }
          }

          setConversations((prev) =>
            prev
              .map((c) => {
                if (c.id !== updated.id) return c;

                const isUnread =
                  updated.last_message_sender_id !== currentUser.id &&
                  (!c.last_read_at ||
                    new Date(updated.last_message_at) >
                      new Date(c.last_read_at));

                return {
                  ...c,
                  ...updated,
                  unread_count: isUnread ? 1 : 0,
                };
              })
              .sort(
                (a, b) =>
                  new Date(b.last_message_at || 0) -
                  new Date(a.last_message_at || 0),
              ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  /* ============================= */
  /* 4️⃣ Real-Time Message Subscription (Optimized) */
  /* ============================= */
  useEffect(() => {
    if (!currentUser) return;

    const messageChannel = supabase
      .channel("message-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new;

          // Only care about messages from this user
          if (newMessage.sender_user_id !== currentUser.id) return;
          if (newMessage.sender_type !== "real_user") return;

          console.log(
            "📨 User sent a new message, updating conversation:",
            newMessage,
          );

          // ✅ Optimistically update the conversation in the list
          setConversations((prev) => {
            const updated = prev.map((conv) => {
              if (conv.id !== newMessage.conversation_id) return conv;

              return {
                ...conv,
                last_message_at: newMessage.created_at,
                last_message_sender_id: currentUser.id,
                last_message_preview:
                  newMessage.content?.substring(0, 50) || "📷",
                unread_count: 0,
              };
            });

            // Sort conversations by last_message_at
            return updated.sort(
              (a, b) =>
                new Date(b.last_message_at || 0) -
                new Date(a.last_message_at || 0),
            );
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [currentUser]); // ✅ Removed loadConversations from dependencies

  /* ============================= */
  /* 5️⃣ Real-Time Notification Subscription */
  /* ============================= */
  const notificationSoundRef = useRef(null);

  useEffect(() => {
    try {
      notificationSoundRef.current = new Audio("/notification.mp3");
    } catch (err) {
      console.error("Audio init failed:", err);
    }
  }, []);

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("new-message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new;

          const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select("user_id")
            .eq("id", newMessage.conversation_id)
            .single();

          if (convError || !conversation) return;

          if (conversation.user_id !== currentUser.id) return;

          if (
            newMessage.sender_type === "real_user" &&
            newMessage.sender_user_id === currentUser.id
          ) {
            return;
          }

          if (newMessage.conversation_id === conversationId) return;

          let senderName = "Someone";
          if (newMessage.sender_type === "fictional") {
            const { data: sender } = await supabase
              .from("fictional_profiles")
              .select("display_name")
              .eq("id", newMessage.sender_fictional_id)
              .single();
            senderName = sender?.display_name || "Fictional user";
          }

          showToast(`${senderName} sent a message`, "info");

          if (notificationSoundRef.current) {
            notificationSoundRef.current.currentTime = 0;
            notificationSoundRef.current.play().catch((err) => {
              console.error("Sound play failed:", err);
            });
          }

          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted" &&
            document.hidden
          ) {
            new Notification("New message", {
              body: `${senderName} sent you a message`,
              icon: "/favicon.ico",
            });
          }

          const { data: blockCheck } = await supabase
            .from("blocked_profiles")
            .select("id")
            .eq("user_profile_id", currentUser.id)
            .eq("blocked_fictional_id", newMessage.sender_fictional_id)
            .maybeSingle();

          if (blockCheck) {
            console.log("🚫 Message from blocked profile ignored");
            return;
          }
        },
      )
      .subscribe((status) => {
        console.log("📡 Notification channel:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, conversationId]);

  /* ============================= */
  /* 6️⃣ Debounced Search */
  /* ============================= */
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  /* ============================= */
  /* 7️⃣ Filters */
  /* ============================= */

  const filteredConversations = useMemo(() => {
    let result = conversations;

    switch (filter) {
      case "unread":
        result = result.filter((c) => c.unread_count > 0);
        break;
      case "flirts":
        return flirtConversations;
      case "favorites":
        result = result.filter((c) => c.is_favorite);
        break;
      default:
        break;
    }

    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();

      result = result.filter((c) => {
        const name = c.fictional_profiles?.display_name?.toLowerCase() || "";
        const lastMessage = c.last_message_preview?.toLowerCase() || "";
        return name.includes(term) || lastMessage.includes(term);
      });
    }

    return result;
  }, [conversations, flirtConversations, filter, debouncedSearchTerm]);

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  /* ============================= */
  /* 8️⃣ Mark As Read */
  /* ============================= */

  const handleConversationSelect = async (id) => {
    if (!currentUser) {
      console.warn("No current user to mark conversation as read");
      return;
    }

    setIsMobileListOpen(false);
    navigate(`/chat/${id}`);

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );

    try {
      await supabase.from("conversation_reads").upsert({
        conversation_id: id,
        user_id: currentUser.id,
        last_read_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to mark conversation as read:", err);
    }
  };

  /* ============================= */
  /* 9️⃣ UI Helpers */
  /* ============================= */

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((word) => word[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes < 1 ? "Just now" : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const handleToggleFavoriteFromList = async (e, conversation) => {
    e.stopPropagation();

    if (!currentUser) {
      showToast("Please log in to favorite conversations", "error");
      return;
    }

    const newValue = !conversation.is_favorite;

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ is_favorite: newValue })
        .eq("id", conversation.id);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, is_favorite: newValue } : c,
        ),
      );
    } catch (err) {
      console.error("DB update failed:", err);
      showToast("Failed to update favorite", "error");
    }
  };

  // Determine which conversations to display
  const displayConversations =
    filter === "flirts" ? flirtConversations : filteredConversations;
  const isLoading = filter === "flirts" ? loadingFlirts : loading;

  return (
    <main className="h-screen pt-16 flex flex-col md:flex-row bg-primary/10 overflow-hidden">
      {/* Sidebar - Full height with fixed header and scrollable list */}
      <div
        className={`
          md:w-[360px] md:min-w-[320px] lg:min-w-[360px] flex flex-col
          ${conversationId ? "hidden md:flex" : "flex"}
          transform transition-transform duration-300 ease-in-out
          ${
            isMobileListOpen || !conversationId
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
         h-full bg-primary/10 backdrop-blur-sm border-r border-primary/10
        `}
      >
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div
              className={`px-5 py-3 rounded-xl shadow-2xl border ${
                toast.type === "error"
                  ? "bg-red-500 border-red-400 text-white"
                  : toast.type === "success"
                    ? "bg-green-500 border-green-400 text-white"
                    : "bg-primary border-white/20 text-white"
              }`}
            >
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        )}

        {/* Fixed Header Section */}
        <div className="flex-shrink-0">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-text-primary">
                Messages
              </h1>
              <button
                onClick={loadConversations}
                disabled={loading}
                className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                aria-label="Refresh conversations"
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
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            <div className="relative">
              <input
                type="search"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 pr-4 py-2 text-sm w-full"
              />
              <svg
                className="absolute left-3 top-2/3 transform -translate-y-1/2 w-4 h-4 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="px-4 sm:px-6 py-3 border-b border-primary/10 overflow-x-auto">
            <div className="flex gap-2 whitespace-nowrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === "all"
                    ? "text-white bg-primary"
                    : "text-text-secondary hover:text-primary hover:bg-primary/10"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === "unread"
                    ? "text-white bg-primary"
                    : "text-text-secondary hover:text-primary hover:bg-primary/10"
                }`}
              >
                Unread
                {totalUnread > 0 && (
                  <span className="ml-2 text-xs text-red-500">
                    ({totalUnread})
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter("flirts")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === "flirts"
                    ? "text-white bg-primary"
                    : "text-text-secondary hover:text-primary hover:bg-primary/10"
                }`}
              >
                Flirts
                {flirtConversations.length > 0 && (
                  <span className="ml-2 text-xs text-pink-500">
                    ({flirtConversations.length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter("favorites")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === "favorites"
                    ? "text-white bg-primary"
                    : "text-text-secondary hover:text-primary hover:bg-primary/10"
                }`}
              >
                Favorites
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ChatListSkeleton />
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-2">
                Failed to load conversations
              </div>
              <button
                onClick={loadConversations}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : displayConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageSquare size={24} className="text-gray-400" />
              </div>
              <p className="font-medium">
                {filter === "flirts"
                  ? "No flirt messages yet"
                  : searchTerm
                    ? "No result found"
                    : "No conversations yet"}
              </p>
              <p className="text-sm mt-1">
                {filter === "flirts"
                  ? "Flirt messages from pokers will appear here"
                  : "Start a new conversation to see it here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleConversationSelect(conversation.id);
                    }
                  }}
                  className={`
                    w-full p-4 flex items-center space-x-3 hover:bg-primary/5
                    active:bg-gray-100 transition-colors text-left cursor-pointer
                    ${
                      conversationId === conversation.id
                        ? "bg-primary border-l-4 border-primary"
                        : ""
                    }
                    ${filter === "flirts" ? "border-l-4 border-pink-400" : ""}
                  `}
                  aria-current={
                    conversationId === conversation.id ? "page" : undefined
                  }
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                        filter === "flirts"
                          ? "from-pink-100 to-rose-100"
                          : "from-blue-100 to-purple-100"
                      } flex items-center justify-center`}
                    >
                      {conversation.fictional_profiles?.image_url ? (
                        <img
                          src={conversation.fictional_profiles.image_url}
                          alt={conversation.fictional_profiles.display_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className={`font-semibold ${
                            filter === "flirts"
                              ? "text-pink-600"
                              : "text-blue-600"
                          }`}
                        >
                          {getInitials(
                            conversation.fictional_profiles?.display_name ||
                              "U",
                          )}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {conversation.fictional_profiles?.display_name ||
                            "Unknown"}
                        </h3>
                        {filter === "flirts" && (
                          <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full flex-shrink-0">
                            Flirt
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {!conversation.is_flirt_conversation && (
                          <button
                            onClick={(e) =>
                              handleToggleFavoriteFromList(e, conversation)
                            }
                            title="Toggle favorite"
                            className="text-sm w-5 text-center hover:text-yellow-500 transition-colors"
                          >
                            {conversation.is_favorite ? "★" : "☆"}
                          </button>
                        )}
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500 truncate flex-1">
                        {conversation.last_message_preview || "No messages yet"}
                      </p>
                      {!conversation.is_flirt_conversation &&
                        conversation.unread_count > 0 && (
                          <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 flex-shrink-0">
                            {conversation.unread_count}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileListOpen && !conversationId && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileListOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat Area */}
      <div
        className={`
          flex-1 min-h-0 flex flex-col overflow-hidden
          ${!conversationId ? "hidden md:flex" : "flex"}
        `}
      >
        {conversationId ? (
          <Outlet context={{ onBack: () => setIsMobileListOpen(true) }} />
        ) : (
          <div className="flex-1 flex items-center bg-surface justify-center p-6">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageSquare size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the list to start messaging, or
                create a new one to begin.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
