import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    async function load() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error) setMessages(data ?? []);
      setLoading(false);
    }

    load();
  }, [conversationId]);

  return { messages, loading };
}
