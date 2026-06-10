import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          fictional_profiles (
            id,
            display_name,
            photos
          )
        `
        )
        .order("created_at", { ascending: false });

      if (!error) setConversations(data ?? []);
      setLoading(false);
    }

    load();
  }, [user]);

  return { conversations, loading };
}
