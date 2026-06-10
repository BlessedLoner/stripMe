// components/SimpleHeader.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";

export default function SimpleHeader() {
  const navigate = useNavigate();

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={Logo} alt="StripMe" className="h-8 w-8" />
          <span className="text-xl font-serif font-semibold text-gray-800">
            StripMe
          </span>
        </Link>
      </div>
    </header>
  );
}
