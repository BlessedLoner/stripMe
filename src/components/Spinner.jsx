import React from "react";
import "./Spinner.css";
import Logo from "../assets/Logo.png";

export const LoveSpinner = ({
  size = "medium",
  color = "#ff3e6c",
  className = "",
  ariaLabel = "Loading",
}) => {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80,
  };

  const containerStyle = {
    "--spinner-color": color,
    "--spinner-size": `${sizeMap[size]}px`,
  };

  return (
    <div
      className={`love-spinner-container ${className}`}
      style={containerStyle}
      role="status"
      aria-label={ariaLabel}
      data-testid="love-spinner"
    >
      <div className="love-spinner">
        <img src={Logo} alt="StripPals" className="mx-auto w-24 h-24 mb-4" />

        {[...Array(3)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="love-spinner__sparkle"
            style={{ "--sparkle-index": i }}
          />
        ))}

        {[...Array(3)].map((_, i) => (
          <div
            key={`pulse-${i}`}
            className="love-spinner__pulse-ring"
            style={{ "--pulse-index": i }}
          />
        ))}
      </div>
    </div>
  );
};
