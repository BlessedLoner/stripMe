import React, { useEffect, useState } from "react";
import "./slider.css"; // we’ll add this next
import { members } from "../data/members";

export default function SlideingCard() {
  //   const images = [
  //     "https://images.unsplash.com/photo-1517841905240-472988babdf9",
  //     "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  //     "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  //     "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  //     "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
  //     "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  //     "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  //     "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
  //   ];

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
