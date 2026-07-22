// // App.jsx
// App.jsx

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import NavBar from "./components/Navbar";
import Chat from "./pages/Chat";
import ProfilePage from "./pages/ProfilePage";
import CreditStore from "./pages/CreditStore";
import AccountSettings from "./pages/AccountSettings";
import Home from "./pages/Home";
import SignUpPage from "./pages/SignUp";
import RedirectPage from "./pages/RedirectPage";
import MembersFromDB from "./pages/Members";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabaseClient";

import ChatLayout from "./components/chat/ChatLayout";
import AdminPage from "./pages/admin/AdminPage";
import AdminRoute from "./pages/admin/AdminRoute";
import AuthGate from "./components/AuthGate";
import AuthCallback from "./pages/AuthCallback";

import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiesPolicy from "./pages/CookiesPolicy";
import ComplaintPolicy from "./pages/ComplaintPolicy";
import C2257 from "./pages/C2257";
import DMCA from "./pages/DMCA";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import ProtectOurChildren from "./pages/ProtectOurChildren";
// In App.jsx, add the new route
import CompleteProfile from "./pages/CompleteProfile"; // Add this import

function AppRoutes() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);

  async function fetchProfile() {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const hideNavbarPaths = [
    "/",
    "/home",
    "/sign-up",
    "/admin",
    "/terms",
    "/privacy",
    "/cookies",
    "/complaint",
    "/2257",
    "/dmca",
    "/pricing",
    "/contact",
    "/protect",
  ];

  const hideNavbarPrefixes = ["/auth"];

  const hideNav =
    hideNavbarPaths.includes(location.pathname) ||
    hideNavbarPrefixes.some((p) => location.pathname.startsWith(p));

  if (loading) return null;

  return (
    <>
      {!hideNav && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/10">
          <NavBar />
        </div>
      )}

      <Routes>
        {/* ========================= */}
        {/* PUBLIC ROUTES */}
        {/* ========================= */}

        {/* ✅ IMPORTANT: OAuth callback OUTSIDE AuthGate */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          path="/"
          element={<Navigate to={user ? "/members" : "/home"} />}
        />

        <Route path="/home" element={<Home />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/redirect" element={<RedirectPage />} />

        {/* Legal */}
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiesPolicy />} />
        <Route path="/complaint" element={<ComplaintPolicy />} />
        <Route path="/2257" element={<C2257 />} />
        <Route path="/dmca" element={<DMCA />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/protect" element={<ProtectOurChildren />} />

        {/* ========================= */}
        {/* PROTECTED APP */}
        {/* ========================= */}

        <Route
          path="/admin"
          element={
            <AuthGate>
              <AdminRoute user={user} profile={profile}>
                <AdminPage />
              </AdminRoute>
            </AuthGate>
          }
        />

        <Route
          path="/members"
          element={
            <AuthGate>
              <ProtectedRoute>
                <MembersFromDB />
              </ProtectedRoute>
            </AuthGate>
          }
        />

        <Route
          path="/chat"
          element={
            <AuthGate>
              <ProtectedRoute>
                <ChatLayout />
              </ProtectedRoute>
            </AuthGate>
          }
        >
          <Route
            index
            element={
              <div className="p-6 text-gray-400">Select a conversation</div>
            }
          />

          <Route path=":conversationId" element={<Chat />} />
        </Route>

        <Route
          path="/profile/:id"
          element={
            <AuthGate>
              <ProtectedRoute>
                <ProfilePage key={location.pathname} />
              </ProtectedRoute>
            </AuthGate>
          }
        />

        <Route
          path="/credits"
          element={
            <AuthGate>
              <ProtectedRoute>
                <CreditStore />
              </ProtectedRoute>
            </AuthGate>
          }
        />

        <Route
          path="/settings"
          element={
            <AuthGate>
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            </AuthGate>
          }
        />

        {/* ========================= */}
        {/* FALLBACK */}
        {/* ========================= */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
