import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useEnsureProfile() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    async function ensureProfile() {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Profile check failed:", error);
        return;
      }

      if (!data) {
        await supabase.from("user_profiles").insert({
          user_id: user.id,
          display_name: user.email?.split("@")[0] ?? "User",
          age: 18,
        });
      }
    }

    ensureProfile();
  }, [user]);
}
