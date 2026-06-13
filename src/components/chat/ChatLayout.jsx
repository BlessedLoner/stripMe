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
  /* Polling for conversation updates (fixes last message preview) */
  /* ============================= */
  // useEffect(() => {
  //   if (!currentUser) return;

  //   // Poll every 3 seconds to refresh conversations
  //   pollingIntervalRef.current = setInterval(() => {
  //     console.log("🔄 Polling for conversation updates...");
  //     loadConversations();
  //     fetchFlirtConversations();
  //   }, 3000);

  //   return () => {
  //     if (pollingIntervalRef.current) {
  //       clearInterval(pollingIntervalRef.current);
  //     }
  //   };
  // }, [currentUser, loadConversations, fetchFlirtConversations]);

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
                  last_message_at: updated.last_message_at,
                  last_message_sender_id: updated.last_message_sender_id,
                  last_message_preview: updated.last_message_preview,
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
  // const getInitials = (name) => {
  //   return name
  //     .split(" ")
  //     .map((word) => word[0])
  //     .join("")
  //     .toUpperCase()
  //     .slice(0, 2);
  // };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((word) => word[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // const formatTime = (dateString) => {
  //   const date = new Date(dateString);
  //   const now = new Date();
  //   const diffInHours = (now - date) / (1000 * 60 * 60);

  //   if (diffInHours < 24) {
  //     return date.toLocaleTimeString([], {
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     });
  //   } else if (diffInHours < 48) {
  //     return "Yesterday";
  //   } else {
  //     return date.toLocaleDateString([], { month: "short", day: "numeric" });
  //   }
  // };

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
  <div style={{ padding: 40 }}>
    <h1>Chat Layout Loaded</h1>
    <p>Safari Test</p>
  </div>
);
}
