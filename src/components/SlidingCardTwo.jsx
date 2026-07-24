// SlidingCardTwo.jsx - Using real data from Supabase
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Slider.css";

export default function SlidingCardTwo() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("fictional_profiles")
          .select("id, display_name, image_url, age")
          .eq("is_deleted", false)
          .limit(30);

        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error("Error fetching profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) {
    return (
      <div className="slider-container overflow-hidden w-full bg-gradient-to-r from-pink-50 to-rose-50 py-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return null;
  }

  return (
    <div className="slider-container overflow-hidden w-full bg-gradient-to-r from-pink-50 to-rose-50 py-4">
      <div className="slider-track flex gap-4 animate-slide">
        {[...profiles, ...profiles].map((profile, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-40 h-40 rounded-xl overflow-hidden shadow-md relative group cursor-pointer"
          >
            <img
              src={profile.image_url || "/default-avatar.png"}
              alt={profile.display_name || "Profile"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs font-medium truncate">
                {profile.display_name}, {profile.age}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
