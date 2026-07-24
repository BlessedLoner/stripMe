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

  if (profiles.length === 0) {
    return null;
  }

  return (
    <div className="slider-container overflow-hidden w-full bg-gradient-to-r from-pink-50 to-rose-50 py-4">
      <div className="slider-track flex gap-4 animate-slide">
        {[...profiles, ...profiles].map((profile, i) => (
          <img
            src={profile.image_url}
            alt={profile.display_name || "Profile"}
            className="w-40 h-40 rounded-xl object-cover shadow-md"
          />
        ))}
      </div>
    </div>
  );
}
