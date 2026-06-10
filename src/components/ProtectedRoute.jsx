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
        window.location.replace("/sign-up");
        alert("You must be logged in to access this page.");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // 🆕 NEW USER → SEND TO SIGNUP (NOT HOME)
      if (!profile) {
        window.location.replace("/sign-up"); // ✅ FIX
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

// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();

//   if (loading) return null; // or loader

//   if (!user) return <Navigate to="/home" replace />;

//   return children;
// }
