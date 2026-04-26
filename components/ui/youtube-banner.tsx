"use client";

import { useState } from "react";

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return m?.[1] ?? null;
}

export function YouTubeBanner({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractVideoId(url);

  if (playing && videoId) {
    return (
      <div style={{ position: "relative", marginBottom: 16, borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", background: "#000" }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      </div>
    );
  }

  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  return (
    <button
      onClick={() => setPlaying(true)}
      style={{
        display: "block",
        width: "100%",
        marginBottom: 16,
        padding: 0,
        border: "1px solid rgba(255,0,0,0.28)",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        background: "transparent",
        position: "relative",
        aspectRatio: "16/9",
      }}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <img
          src={thumbnail}
          alt="Video thumbnail"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}

      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: thumbnail ? "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.38) 100%)" : "rgba(0,0,0,0.6)" }} />

      {/* Play button */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
      }}>
        <div style={{
          width: 64, height: 44,
          background: "#FF0000",
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(255,0,0,0.5)",
        }}>
          <span style={{ color: "#fff", fontSize: 18, marginLeft: 3 }}>▶</span>
        </div>
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#fff",
        }}>
          Ver en YouTube
        </span>
      </div>
    </button>
  );
}
