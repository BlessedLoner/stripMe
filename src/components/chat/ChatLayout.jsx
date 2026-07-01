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
  const pollingIntervalRef = useRef(null);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  /* ============================= */
  /* 1️⃣ Load Auth User */
  /* ============================= */

  useEffect(() => {
    const loadProfile = async () => {
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
        return;
      }

      setCurrentUser(profile);
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
      // Get conversations that have flirt messages
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

      // Format flirt conversations
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
    console.log("🔵 loadConversations running", new Date().toISOString());
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

      console.log("📦 Raw conversations data:", convs);

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
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) loadConversations();
  }, [currentUser, loadConversations]);

  /* ============================= */
  /* 3️⃣ Real-Time Subscription */
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

                  // merge ALL updated fields
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

    console.log(
      "ACTIVE CHANNELS:",
      supabase.getChannels().map((c) => c.topic),
    );

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // *************************
  const notificationSoundRef = useRef(null);

  // useEffect(() => {
  //   notificationSoundRef.current = new Audio("/notification.mp3");
  // }, []);

  useEffect(() => {
    try {
      notificationSoundRef.current = new Audio("/notification.mp3");
    } catch (err) {
      console.error("Audio init failed:", err);
    }
  }, []);

  // useEffect(() => {
  //   if (Notification.permission === "default") {
  //     Notification.requestPermission();
  //   }
  // }, []);

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  /* ============================= */
  /* Real-Time Notification Subscription */
  /* ============================= */
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

          showToast(`${senderName} sent a message`);

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
  /* 4️⃣ Filters */
  /* ============================= */

  const filteredConversations = useMemo(() => {
    let result = conversations;

    switch (filter) {
      case "unread":
        result = result.filter((c) => c.unread_count > 0);
        break;
      case "flirts":
        // When "Flirts" tab is selected, show flirt conversations
        return flirtConversations;
      case "favorites":
        result = result.filter((c) => c.is_favorite);
        break;
      default:
        break;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      result = result.filter((c) => {
        const name = c.fictional_profiles?.display_name?.toLowerCase() || "";
        const lastMessage = c.last_message_preview?.toLowerCase() || "";
        return name.includes(term) || lastMessage.includes(term);
      });
    }

    return result;
  }, [conversations, flirtConversations, filter, searchTerm]);

  // const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);
  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  /* ============================= */
  /* 5️⃣ Mark As Read */
  /* ============================= */

  const handleConversationSelect = async (id) => {
    setIsMobileListOpen(false);
    navigate(`/chat/${id}`);

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );

    await supabase.from("conversation_reads").upsert({
      conversation_id: id,
      user_id: currentUser.id,
      last_read_at: new Date().toISOString(),
    });
  };

  /* ============================= */
  /* 6️⃣ UI */
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

    if (diffInHours < 24) {
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

    const newValue = !conversation.is_favorite;

    const { data, error } = await supabase
      .from("conversations")
      .update({ is_favorite: newValue })
      .eq("id", conversation.id)
      .select();

    console.log("Update result:", data, error);

    if (error) {
      console.error("DB update failed:", error.message);
      alert("DB update failed: " + error.message);
      return;
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, is_favorite: newValue } : c,
      ),
    );
  };

  // Determine which conversations to display
  const displayConversations =
    filter === "flirts" ? flirtConversations : filteredConversations;
  const isLoading = filter === "flirts" ? loadingFlirts : loading;

  return (
    <main className="pt-16 flex flex-col md:flex-row h-screen overflow-hidden bg-primary/10">
      <div
        className={`
              md:w-[360px] border-r flex flex-col
            ${conversationId ? "hidden md:flex" : "flex"}
            transform transition-transform duration-300 ease-in-out
            ${
              isMobileListOpen || !conversationId
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }
          `}
      >
        {toast && (
          <div
            className="fixed 
                  backdrop-blur-md bg-primary dark:bg-primary 
                  border border-white/20 rounded-xl 
                  px-5 py-3 shadow-2xl
                  animate-slide-up"
          >
            <p className="text-sm font-medium text-black dark:text-black">
              {toast}
            </p>
          </div>
        )}
        <div className="p-6 border-b border-primary">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-serif font-semibold text-text-primary">
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

        <div className="px-6 py-3 border-b border-primary/10">
          <div className="flex gap-2 whitespace-nowrap overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium  rounded-lg ${
                filter === "all"
                  ? "text-white bg-primary"
                  : "text-text-secondary hover:text-primary hover:bg-primary/10"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === "unread"
                  ? "text-white bg-primary"
                  : "text-text-secondary hover:text-primary hover:bg-primary/10"
              }`}
            >
              Unread
              <span className="ml-2 text-xs text-red-500">
                {totalUnread > 0 && `(${totalUnread})`}
              </span>
            </button>
            <button
              onClick={() => setFilter("flirts")}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
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
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === "favorites"
                  ? "text-white bg-primary"
                  : "text-text-secondary hover:text-primary hover:bg-primary/10"
              }`}
            >
              Favorites
            </button>
          </div>
        </div>

        {/* Conversation Items - Unified display */}
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
                  onKeyDown={(e) =>
                    e.key === " Enter" &&
                    handleConversationSelect(conversation.id)
                  }
                  className={`
                      w-full p-4 flex items-center space-x-3 hover:bg-primary/5
                      active:bg-gray-100 transition-colors text-left cursor-pointer
                      ${
                        conversationId === conversation.id
                          ? "bg-primary border-l-4 border-blue-500"
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {conversation.fictional_profiles?.display_name ||
                            "Unknown"}
                        </h3>
                        {filter === "flirts" && (
                          <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
                            Flirt
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {!conversation.is_flirt_conversation && (
                          <button
                            onClick={(e) =>
                              handleToggleFavoriteFromList(e, conversation)
                            }
                            title="Toggle favorite"
                            className="text-sm w-5 text-center"
                          >
                            {conversation.is_favorite ? "★" : "☆"}
                          </button>
                        )}

                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500 w-14 text-right">
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
                          <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
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
          <div className="md:flex flex-1 items-center bg-surface justify-center p-6">
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
