"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen({ text = "A carregar arena..." }: { text?: string }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "radial-gradient(ellipse at 50% 35%, #2a1050 0%, #0e0520 60%, #08021a 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
      fontFamily: "monospace",
    }}>
      <div style={{ position: "absolute", top: "10%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.16) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        fontSize: "clamp(22px, 6vw, 36px)", fontWeight: 900, letterSpacing: 3,
        background: "linear-gradient(135deg, #fff, #aa55ff)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        textAlign: "center", padding: "0 20px",
      }}>
        Last Stand Arena
      </div>
      <div style={{ fontSize: 13, color: "rgba(200,150,255,0.5)", letterSpacing: 3, textTransform: "uppercase" }}>
        {text}{dots}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "rgba(123,47,247,0.5)",
            animation: `splashPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes splashPulse { 0%,100%{opacity:0.2;transform:scale(0.7)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
    </div>
  );
}
