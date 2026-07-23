// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import RedirectPage from "./RedirectPage";

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const authIntent = sessionStorage.getItem("auth_intent");

        // ❌ No authenticated user
        if (!user) {
          console.error("No user found in callback");
          window.location.replace("/sign-up?error=no_user");
          return;
        }

        console.log("✅ User authenticated:", user.id);

        // ✅ Check if profile already exists
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        // ✅ Existing user → allow login
        if (existingProfile) {
          console.log("✅ Existing profile found, redirecting to members");
          localStorage.removeItem("signup_data");
          sessionStorage.removeItem("signup_data");
          window.location.replace("/members");
          return;
        }

        // User tried to SIGN IN but no profile exists
        if (authIntent === "signin") {
          await supabase.auth.signOut();

          sessionStorage.removeItem("auth_intent");

          window.location.replace(
            "/sign-up?error=" +
              encodeURIComponent(
                "We couldn't find an account linked to your Google login. Please register to continue.",
              ),
          );

          return;
        }

        // ✅ Recover signup data from localStorage
        let savedData = null;
        try {
          const rawData = localStorage.getItem("signup_data");
          if (rawData) {
            savedData = JSON.parse(rawData);
          }
        } catch (e) {
          console.error("Error parsing signup_data:", e);
        }

        // Try sessionStorage as fallback
        if (!savedData) {
          try {
            const rawData = sessionStorage.getItem("signup_data");
            if (rawData) {
              savedData = JSON.parse(rawData);
            }
          } catch (e) {
            console.error("Error parsing session signup_data:", e);
          }
        }

        console.log("📦 Signup data:", savedData);

        console.log("===== SAVED SIGNUP DATA =====");
        console.log(savedData);

        console.log("displayName:", savedData?.displayName);
        console.log("gender:", savedData?.gender);
        console.log("lookingFor:", savedData?.lookingFor);
        console.log("dateOfBirth:", savedData?.dateOfBirth);
        console.log("country:", savedData?.country);
        console.log("location:", savedData?.location);
        console.log("============================");

        // ❌ User tried to bypass signup flow
        // ✅ FIX: Only check for fields that are actually in the form
        if (
          !savedData ||
          !savedData.displayName ||
          !savedData.gender ||
          !savedData.lookingFor ||
          !savedData.dateOfBirth ||
          !savedData.country
        ) {
          console.log(
            "❌ Incomplete signup data, redirecting to complete profile",
          );

          // Save what we have for recovery
          sessionStorage.setItem(
            "auth_recovery",
            JSON.stringify({
              user_id: user.id,
              data: savedData || {},
              error: "incomplete_data",
              timestamp: new Date().toISOString(),
            }),
          );

          window.location.replace(
            "/sign-up?error=Please complete the registration form before continuing.",
          );
          return;
        }

        // Calculate age from date of birth
        const calculateAge = (dob) => {
          const birthDate = new Date(dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        };

        const age = calculateAge(savedData.dateOfBirth);

        // ✅ Create FULL profile (with only the fields we have)
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            display_name:
              savedData.displayName ||
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "User",
            country: savedData.country,
            city: savedData.location?.city || savedData.location?.town || null,
            state:
              savedData.location?.state || savedData.location?.region || null,
            location_latitude: savedData.location?.lat || null,
            location_longitude: savedData.location?.lng || null,
            gender: savedData.gender,
            looking_gender: savedData.lookingFor,
            age: age,
            date_of_birth: savedData.dateOfBirth || null,
            interests: [], // Empty for now - will be filled later
            email_verified: true,
          });

        // ❌ Profile creation failed
        if (profileError) {
          console.error("❌ PROFILE CREATION FAILED:", profileError);

          // Save recovery data
          sessionStorage.setItem(
            "auth_recovery",
            JSON.stringify({
              user_id: user.id,
              data: savedData,
              error: profileError.message,
              timestamp: new Date().toISOString(),
            }),
          );

          // Redirect to complete profile page with error
          window.location.replace(
            "/complete-profile?error=" +
              encodeURIComponent(profileError.message),
          );
          return;
        }

        // ✅ Success! Cleanup and redirect
        console.log("✅ Profile created successfully!");

        localStorage.removeItem("signup_data");
        sessionStorage.removeItem("signup_data");
        sessionStorage.removeItem("auth_recovery");

        // IMPORTANT
        sessionStorage.removeItem("auth_intent");

        window.location.replace("/members");
      } catch (err) {
        console.error("❌ AUTH CALLBACK ERROR:", err);

        // Try to get user for recovery
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            sessionStorage.setItem(
              "auth_recovery",
              JSON.stringify({
                user_id: user.id,
                data: null,
                error: err.message,
                timestamp: new Date().toISOString(),
              }),
            );
          }
        } catch (e) {
          console.error("Failed to capture user for recovery:", e);
        }

        window.location.replace(
          "/complete-profile?error=" + encodeURIComponent(err.message),
        );
      }
    };

    handleAuth();
  }, []);

  return <RedirectPage />;
}
