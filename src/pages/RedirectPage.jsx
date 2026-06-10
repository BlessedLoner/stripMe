import React, { useEffect } from "react";
import Logo from "../assets/Logo.png";
import "./RedirectPage.css";

const RedirectPage = () => {
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      window.location.href = "/sign-up";
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, []);

  return (
    <>
      <main className="redirect-page min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-700 to-secondary-800 text-white px-6">
        <header className="flex flex-col items-center mb-8 pt-16">
          <img
            src={Logo}
            alt="StripMe logo"
            className="w-40 h-40 object-contain mb-4"
          />
          {/* <span className="logo text-3xl md:text-4xl font-serif font-semibold tracking-tight">
            StripMe
          </span> */}
        </header>

        <section className="loading-section flex flex-col items-center space-y-4">
          <div className="spinner-container relative">
            {/* Main spinning circle */}
            <div
              className="spinner w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin"
              role="status"
              aria-hidden="true"
            ></div>

            {/* Subtle pulse ring */}
            <div
              className="spinner-ring absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            ></div>
          </div>

          <div className="loading-text text-center text-base md:text-lg text-white/90">
            <h3>Getting things ready for you...</h3>
            <p>Taking you to the amazing experience</p>
          </div>
        </section>
      </main>
    </>
  );
};

export default RedirectPage;
