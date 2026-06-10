import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/Logo.png";
import { supabase } from "../lib/supabaseClient";

function NavBar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getUserInitial = () => {
    if (user?.display_name) return user.display_name.charAt(0).toUpperCase();
    return "U";
  };

  // Logout function
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      return;
    }

    // redirect to sign-up page
    navigate("/home", { replace: true });
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  return (
    <>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 shadow">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img className="h-24 w-auto" src={Logo} alt="App Logo" />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/Members"
              className="text-text-secondary hover:text-primary transition-colors duration-300"
            >
              Members
            </Link>

            <Link
              to="/chat"
              className="text-text-secondary hover:text-primary transition-colors duration-300"
            >
              Chat
            </Link>

            <Link
              to="/credits"
              className="text-text-secondary hover:text-primary transition-colors duration-300"
            >
              Credits
            </Link>

            <Link
              to="/Settings"
              className="text-text-secondary hover:text-primary transition-colors duration-300"
            >
              Settings
            </Link>

            {/* <Link
              to="/admin"
              className="text-text-secondary hover:text-primary transition-colors duration-300"
            >
              Admin
            </Link> */}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-text-secondary hover:text-primary transition-colors duration-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-5 5-5-5h5v-12"
                />
              </svg>
            </button>

            <div className="pt-2 hidden md:flex">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 py-3 px-4 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group w-full text-left"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-primary/10 border-t border-gray-200 shadow-lg py-4 px-6 space-y-2">
            {/* Home Link */}

            {/* Members Link */}
            <Link
              to="/Members"
              onClick={() => setMenuOpen(false)}
              className="flex items-center space-x-3 py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="font-medium group-hover:text-blue-600 transition-colors">
                Members
              </span>
            </Link>

            {/* Chat Link */}
            <Link
              to="/Chat"
              onClick={() => setMenuOpen(false)}
              className="flex items-center space-x-3 py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 group"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <span className="font-medium group-hover:text-green-600 transition-colors">
                Chat
              </span>
            </Link>

            {/* Credit Link */}
            <Link
              to="/credits"
              onClick={() => setMenuOpen(false)}
              className="flex items-center space-x-3 py-3 px-4 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 group"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  role="img"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    fill="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="5.2"
                    stroke="currentColor"
                    strokeWidth="0.9"
                    fill="none"
                  />
                  <path
                    d="M13.7 9.5c-1.2-.9-3.2-.9-4.4 0a3.5 3.5 0 000 5.9c1.2.9 3.2.9 4.4 0"
                    stroke="currentColor"
                    strokeWidth="1.15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M18.2 6.2l.9.5.9-.5-.9-.5-.9.5zM18.2 7.7l.6.35.6-.35-.6-.35-.6.35z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <span className="font-medium group-hover:text-orange-600 transition-colors">
                Credits
              </span>
            </Link>

            {/* Settings Link */}
            <Link
              to="/Settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center space-x-3 py-3 px-4 text-gray-700 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <span className="font-medium group-hover:text-gray-600 transition-colors">
                Settings
              </span>
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Additional Action Items */}
            <div className="pt-2">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 py-3 px-4 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group w-full text-left"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <span className="font-medium group-hover:text-red-600 transition-colors">
                  Logout
                </span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default NavBar;
