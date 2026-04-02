"use client";

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
        padding: "8px 18px",
        fontFamily: "monospace",
        borderBottom: `1px solid ${cardBorder}`,
        transition: "background 1s ease, border-color 1s ease",
        zIndex: 5,
      }}
    >
      {/* Hearts */}
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {Array.from({ length: maxHp }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              background: i < hp ? "#e74c3c" : "rgba(255,255,255,0.12)",
              boxShadow: i < hp ? "0 0 6px #e74c3c88" : "none",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      {/* Wave */}
      <div style={{ textAlign: "center" }}>
        <div style={{ color: textSecondary, fontSize: 9, letterSpacing: 2, transition: "color 1s" }}>
          WAVE
        </div>
        <div style={{ color: "#f39c12", fontSize: isMobile ? 18 : 24, fontWeight: 700, lineHeight: 1, textShadow: "0 0 10px #f39c1288" }}>
          {wave}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: "center" }}>
        <div style={{ color: textSecondary, fontSize: 9, letterSpacing: 2, transition: "color 1s" }}>
          SCORE
        </div>
        <div style={{ color: textPrimary, fontSize: isMobile ? 17 : 22, fontWeight: 700, lineHeight: 1, transition: "color 1s" }}>
          {score}
        </div>
      </div>

      {/* Kills */}
      <div style={{ textAlign: "center" }}>
        <div style={{ color: textSecondary, fontSize: 9, letterSpacing: 2, transition: "color 1s" }}>
          KILLS
        </div>
        <div style={{ color: "#e74c3c", fontSize: isMobile ? 17 : 22, fontWeight: 700, lineHeight: 1, textShadow: "0 0 8px #e74c3c88" }}>
          {kills}
        </div>
      </div>

      {/* Spacer for desktop buttons */}
      {!isMobile && <div style={{ width: 180 }} />}
    </div>
  );
}
