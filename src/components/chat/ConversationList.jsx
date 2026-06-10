import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function ConversationList() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    async function loadConversations() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", auth.user.id)
        .single();

      const { data } = await supabase
        .from("conversations")
        .select(
          `
          id,
          fictional_profiles (
            id,
            display_name
          )
        `,
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      setConversations(data || []);
    }

    loadConversations();
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="p-4 font-bold text-lg border-b">Inbox</h2>

      {conversations.map((c) => (
        <div
          key={c.id}
          onClick={() =>
            navigate(`/chat/${c.id}`, {
              state: { member: c.fictional_profiles },
            })
          }
          className="p-4 border-b cursor-pointer hover:bg-gray-100"
        >
          <p className="font-medium">{c.fictional_profiles.display_name}</p>
        </div>
      ))}
    </div>
  );
}
