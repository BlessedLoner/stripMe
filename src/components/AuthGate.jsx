// AuthGate.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import RedirectPage from "../pages/RedirectPage";

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // ✅ Not logged in
        if (!user) {
          setReady(true);
          return;
        }

        // ✅ OAuth signup currently happening
        const currentPath = window.location.pathname;

        if (currentPath === "/auth/callback") {
          setReady(true);
          return;
        }

        // ✅ Check profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("🔍 AuthGate profile:", profile);

        // ✅ Profile exists → allow access
        if (profile) {
          setReady(true);
          return;
        }

        // ❌ No profile exists
        await supabase.auth.signOut();

        sessionStorage.setItem(
          "auth_message",
          "Account not found. Please sign up first.",
        );

        // ✅ FIX: Redirect to sign-up, not home
        window.location.replace("/sign-up?error=account_not_found");
      } catch (err) {
        console.error("AuthGate error:", err);

        await supabase.auth.signOut();

        // ✅ FIX: Redirect to sign-up
        window.location.replace("/sign-up?error=session_error");
      }
    };

    check();
  }, []);

  if (!ready) {
    return <RedirectPage />;
  }

  return children;
}
