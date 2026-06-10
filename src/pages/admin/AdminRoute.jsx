import { Navigate } from "react-router-dom";

export default function AdminRoute({ user, profile, children }) {
  if (!user) return <Navigate to="/login" />;

  // ⛔ Wait until profile loads
  if (!profile) return <div className="bg-primary pt-20">Loading...</div>;

  if (profile.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}
