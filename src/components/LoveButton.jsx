import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoveButton({
  showToast,
  fictionalProfileId,
  userProfileId,
}) {
  const [liked, setLiked] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkIfLiked = async () => {
      if (!userProfileId || !fictionalProfileId) return;

      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", userProfileId)
        .eq("profile_id", fictionalProfileId)
        .maybeSingle();

      if (error) {
        console.error("Like check error:", error);
        return;
      }

      setLiked(!!data);
    };

    checkIfLiked();
  }, [userProfileId, fictionalProfileId]);

  const handleLove = async () => {
    if (loading) return;

    if (!userProfileId) {
      showToast?.("User not ready");
      return;
    }

    setLoading(true);

    try {
      // Optimistic UI
      setLiked(true);

      const id = Date.now() + Math.random();
      setHearts((prev) => [...prev, id]);

      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h !== id));
      }, 1600);

      // Insert like
      // const { error } = await supabase.from("likes").insert({
      //   user_id: userProfileId,
      //   profile_id: fictionalProfileId,
      // });

      const { error } = await supabase.from("likes").upsert(
        {
          user_id: userProfileId,
          profile_id: fictionalProfileId,
        },
        {
          onConflict: "user_id,profile_id",
        },
      );

      if (error) {
        if (error.code === "23505") {
          showToast?.("Already liked ❤️");
        } else {
          throw error;
        }
      } else {
        showToast?.("You liked this profile ❤️");

        // ✅ Get user details to add to poke_queue
        const { data: userData } = await supabase
          .from("user_profiles")
          .select("display_name, age, country, city")
          .eq("id", userProfileId)
          .single();

        const { data: fictionalData } = await supabase
          .from("fictional_profiles")
          .select("display_name")
          .eq("id", fictionalProfileId)
          .single();

        // Add to poke_queue
        await supabase.from("poke_queue").upsert(
          {
            user_profile_id: userProfileId,
            user_display_name: userData?.display_name,
            user_age: userData?.age,
            user_country: userData?.country,
            user_city: userData?.city,
            liked_fictional_ids: [fictionalProfileId],
            liked_fictional_names: [fictionalData?.display_name],
            status: "pending",
          },
          { onConflict: "user_profile_id" },
        );
      }
    } catch (err) {
      console.error(err);
      setLiked(false);
      showToast?.("Failed to like profile");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="love-btn-wrapper relative inline-flex items-center justify-center">
      {/* Floating hearts */}
      {hearts.map((id) => (
        <span
          key={id}
          className="floating-heart pointer-events-none absolute text-red-500"
          style={{
            // random horizontal offset so hearts don't overlap exactly
            left: `${50 + (Math.random() * 40 - 20)}%`,
            transform: "translateX(-50%)",
            fontSize: `${14 + Math.random() * 8}px`,
            animationDuration: `${1.2 + Math.random() * 0.6}s`,
          }}
        >
          ❤️
        </span>
      ))}

      {/* The main love button (svg) */}
      <button
        onClick={handleLove}
        aria-label="Like"
        className="w-12 h-12 text-red-500 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-transform active:scale-95"
      >
        {liked ? (
          // Filled heart (when liked)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-10 h-10 text-red-600 transition-all duration-300"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.01 4.01 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 17.99 4 20 6.01 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          // Outline heart (when not liked)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="w-8 h-8 text-red-500 transition-all duration-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
