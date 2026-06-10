// components/LegalPageLayout.jsx
import React from "react";
import SimpleHeader from "../components/SimpleHeader";
import Logo from "../assets/Logo.png";
import nipple1 from "../assets/nipple1.jpg";
import newbg from "../assets/newbg.jpg";
import { Link } from "react-router-dom";

export default function LegalPageLayout({ title, children, lastUpdated }) {
  return (
    <div className="relative min-h-[60vh] overflow-hidden flex flex-col">
      <SimpleHeader showBackButton={true} />
      <div className="absolute inset-0 z-0">
        <img
          src={nipple1}
          alt="Happy couple connecting"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
          }}
        />
      </div>

      <main className="relative flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">
            Last updated: {lastUpdated}
          </p>
        )}
        <div className=" rounded-lg shadow-sm p-6 md:p-8 space-y-6 text-gray-700">
          <div className="absolute inset-0 z-0 ">
            <img
              src={newbg}
              alt="Happy couple connecting"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
              }}
            />
            <div className="absolute inset-0 bg-linear-to-r from-primary-900/80 via-secondary-800/70 to-accent-800/60"></div>
          </div>
          {children}
        </div>
      </main>

      <footer className="relative bg-text-primary text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo & Name - Centered */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              <img src={Logo} alt="StripMe" className="w-12 h-12" />
              <span className="ml-2 text-xl font-serif font-semibold text-white">
                StripMe
              </span>
            </div>
          </div>

          {/* Legal Links Row */}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/70 mb-8">
            <Link to="/protect" className="hover:text-white transition">
              Protect our children!
            </Link>
            <span className="text-white/30">/</span>

            <Link to="/terms" className="hover:text-white transition">
              Terms of use
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/cookies" className="hover:text-white transition">
              Cookies
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/complaint" className="hover:text-white transition">
              Complaint policy
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/2257" className="hover:text-white transition">
              2257
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/dmca" className="hover:text-white transition">
              DMCA
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/pricing" className="hover:text-white transition">
              Pricing
            </Link>
            <span className="text-white/30">/</span>
            <Link to="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </div>

          {/* Informational Text */}

          {/* Copyright */}
          <div className="border-t border-white/10 pt-6 text-center">
            <p>
              &copy; {new Date().getFullYear()} StripMe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
