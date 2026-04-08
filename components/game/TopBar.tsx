"use client";

import { useState, useEffect } from "react";

interface Props {
  hp: number;
  maxHp: number;
  wave: number;
  score: number;
  kills: number;
  isMobile: boolean;
  textPrimary: string;
  textSecondary: string;
  topBarBg: string;
  cardBorder: string;
}

export default function TopBar({ hp, maxHp, wave, score, kills, isMobile, textPrimary, textSecondary, topBarBg, cardBorder }: Props) {
  const [isTiny, setIsTiny] = useState(false);
  
  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      setIsTiny(w <= 360);
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  
  const padding = isTiny ? "3px 6px" : isMobile ? "5px 10px" : "8px 18px";
  const heartSize = isTiny ? 8 : isMobile ? 11 : 15;
  const gap = isTiny ? 2 : 4;
  const labelFont = isTiny ? 6 : 8;
  const valueFont = isTiny ? 12 : isMobile ? 15 : 22;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: topBarBg,
        backdropFilter: "blur(8px)",
        padding,
        fontFamily: "monospace",
        borderBottom: `1px solid ${cardBorder}`,
        transition: "background 1s ease, border-color 1s ease",
        zIndex: 5,
        height: isTiny ? 32 : isMobile ? 38 : 50,
      }}
    >
      {/* Hearts */}
      <div style={{ display: "flex", gap, alignItems: "center", minWidth: isTiny ? 50 : "auto" }}>
        {Array.from({ length: maxHp }).map((_, i) => (
          <div
            key={i}
            style={{
              width: heartSize,
              height: heartSize,
              borderRadius: "50%",
              background: i < hp ? "#e74c3c" : "rgba(255,255,255,0.12)",
              boxShadow: i < hp ? "0 0 6px #e74c3c88" : "none",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      {/* Wave */}
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ color: textSecondary, fontSize: labelFont, letterSpacing: 1, transition: "color 1s" }}>
          WAVE
        </div>
        <div style={{ color: "#f39c12", fontSize: isTiny ? 14 : isMobile ? 16 : 24, fontWeight: 700, lineHeight: 1, textShadow: "0 0 10px #f39c1288" }}>
          {wave}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ color: textSecondary, fontSize: labelFont, letterSpacing: 1, transition: "color 1s" }}>
          SCORE
        </div>
        <div style={{ color: textPrimary, fontSize: valueFont, fontWeight: 700, lineHeight: 1, transition: "color 1s" }}>
          {score}
        </div>
      </div>

      {/* Kills */}
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ color: textSecondary, fontSize: labelFont, letterSpacing: 1, transition: "color 1s" }}>
          KILLS
        </div>
        <div style={{ color: "#e74c3c", fontSize: valueFont, fontWeight: 700, lineHeight: 1, textShadow: "0 0 8px #e74c3c88" }}>
          {kills}
        </div>
      </div>

      {/* Spacer for desktop buttons */}
      {!isMobile && !isTiny && <div style={{ width: 40 }} />}
    </div>
  );
}
