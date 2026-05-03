import React from "react";

export default function Logo({ size = 60 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className="relative flex items-center justify-center select-none"
    >
      {/* Glow Background */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border border-cyan-500/30" />

      {/* Inner Logo */}
      <div className="relative w-[65%] h-[65%] rounded-full bg-cyan-500 flex items-center justify-center text-black font-black text-lg shadow-lg">
        N
      </div>
    </div>
  );
}