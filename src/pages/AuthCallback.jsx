// src/pages/AuthCallback.jsx

import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import RedirectPage from "./RedirectPage";

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // ❌ No authenticated user
        if (!user) {
          window.location.replace("/");
          return;
        }

        // ✅ Check if profile already exists
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        // ✅ Existing user → allow login
        if (existingProfile) {
          localStorage.removeItem("signup_data");

          window.location.replace("/members");
          return;
        }

        // ✅ Recover signup data
        const savedData = JSON.parse(localStorage.getItem("signup_data"));

        console.log("OAuth signup data:", savedData);

        // ❌ User tried to bypass signup flow
        if (
          !savedData ||
          !savedData.gender ||
          !savedData.lookingFor ||
          !savedData.age ||
          !savedData.country
        ) {
          console.log("❌ Incomplete signup attempt blocked");

          await supabase.auth.signOut();

          localStorage.removeItem("signup_data");

          sessionStorage.setItem(
            "auth_message",
            "Please complete signup before continuing.",
          );

          window.location.replace("/sign-up");

          return;
        }

        // ✅ Create FULL profile
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,

            display_name:
              savedData.displayName ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User",

            country: savedData.location?.country || savedData.country,

            city:
              savedData.location?.city ||
              savedData.location?.town ||
              savedData.location?.village ||
              null,

            state:
              savedData.location?.state || savedData.location?.region || null,

            location_latitude: savedData.location?.lat || null,

            location_longitude: savedData.location?.lng || null,

            gender: savedData.gender,

            looking_gender: savedData.lookingFor,

            age: parseInt(savedData.age),

            interests: savedData.interests || [],

            relationship_goals: savedData.relationshipGoal
              ? [savedData.relationshipGoal]
              : [],

            date_of_birth: savedData.dateOfBirth || null,

            email_verified: true,
          });

        // ❌ Profile creation failed
        if (profileError) {
          console.error("PROFILE CREATION FAILED:", profileError);

          await supabase.auth.signOut();

          window.location.replace("/");

          return;
        }

        // ✅ Cleanup
        localStorage.removeItem("signup_data");

        // ✅ Enter app
        window.location.replace("/members");
      } catch (err) {
        console.error("AUTH CALLBACK ERROR:", err);

        await supabase.auth.signOut();

        window.location.replace("/");
      }
    };

    handleAuth();
  }, []);

  return <RedirectPage />;
}
