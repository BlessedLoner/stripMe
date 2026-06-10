import React, { useEffect, useState } from "react";
import "./Slider.css"; // we’ll add this next
import { members } from "../data/members";

export default function SlideingCard() {
  return (
    <div className="slider-container overflow-hidden w-full bg-gradient-to-r from-pink-50 to-rose-50 py-4">
      <div className="slider-track flex gap-4 animate-slide">
        {[...members, ...members].map((member, i) => (
          <img
            key={i}
            src={member.image}
            alt={member.name || `img-${i}`}
            className="w-40 h-40 rounded-xl object-cover shadow-md"
          />
        ))}
      </div>
    </div>
  );
}
