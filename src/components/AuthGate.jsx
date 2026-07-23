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

        const authIntent = sessionStorage.getItem("auth_intent");

        // ✅ Not logged in
        if (!user) {
          setReady(true);
          return;
        }

        // Allow the OAuth callback to finish profile creation
        const currentPath = window.location.pathname;

        if (
          currentPath === "/auth/callback" ||
          authIntent === "signup" ||
          authIntent === "signin"
        ) {
          setReady(true);
          return;
        }

        // Check if profile exists
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          sessionStorage.removeItem("auth_intent");
          setReady(true);
          return;
        }

        // Existing login but profile doesn't exist
        await supabase.auth.signOut();

        sessionStorage.setItem(
          "auth_message",
          "We couldn't find an account linked to your Google login. Please register to continue.",
        );

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
