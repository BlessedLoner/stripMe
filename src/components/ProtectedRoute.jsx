// ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // ❌ Not logged in
      if (!user) {
        // ✅ FIX: No alert, just redirect
        sessionStorage.setItem(
          "auth_message",
          "Please log in to access this page.",
        );
        window.location.replace("/sign-up?error=not_logged_in");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // 🆕 NEW USER → SEND TO SIGNUP
      if (!profile) {
        sessionStorage.setItem("auth_message", "Please complete your profile.");
        window.location.replace("/sign-up?error=incomplete_profile");
        return;
      }

      // ✅ REAL USER
      setStatus("allowed");
    };

    checkUser();
  }, []);

  if (status === "loading") return null;

  return children;
}
