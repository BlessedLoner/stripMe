// src/components/VideoCard.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * VideoCard
 *
 * Props:
 *  - src: string (required)
 *  - poster: string (optional)
 *  - title: string (optional)
 *  - controls: boolean (optional)
 *  - autoplay: boolean (optional)
 */
export default function VideoCard({
  src,
  poster,
  title = "Video preview",
  controls = false,
  autoplay = true,
  className = "",
  aspectClass = "aspect-video",
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [userToggled, setUserToggled] = useState(false);

  // track play/pause events (no 'ended' handler so loop isn't overridden)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // ensure the element will loop
    v.loop = true;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  // IntersectionObserver: autoplay/pause when enters/leaves viewport
  useEffect(() => {
    if (!autoplay) return;
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!userToggled) {
            if (entry.isIntersecting) {
              // try autoplay muted
              video.muted = true;
              video.play().catch(() => {
                /* ignore autoplay rejection */
              });
            } else {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [autoplay, userToggled]);

  // toggle play/pause via overlay button or clicking video
  const togglePlay = async (unmuteOnPlay = true) => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (v.paused) {
        if (unmuteOnPlay) v.muted = false;
        await v.play();
        setUserToggled(true);
      } else {
        v.pause();
        setUserToggled(true);
      }
    } catch (err) {
      console.warn("Video play error:", err);
    }
  };

  const onVideoClick = () => togglePlay(true);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden relative ${className}`}
      aria-label={title}
    >
      <div className={`relative w-full ${aspectClass}`}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          muted={autoplay} // autoplayed video must be muted
          loop // native looping attribute
          controls={controls}
          className="w-full h-full object-cover cursor-pointer"
          onClick={onVideoClick}
        />

        {/* Overlay: shown only when video is NOT playing */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            isPlaying ? "opacity-0" : "opacity-100"
          }`}
        >
          {!isPlaying && (
            <button
              onClick={() => togglePlay(true)}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="pointer-events-auto group w-20 h-20 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/60 transition-transform transform hover:scale-105 focus:outline-none"
            >
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Caption area */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-1">
          {title}
        </h3>
        <p className="text-sm text-text-secondary">{isPlaying ? "" : ""}</p>
      </div>
    </div>
  );
}
