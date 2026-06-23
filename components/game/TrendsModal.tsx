"use client";

import { useEffect, useState } from "react";
import {
  X,
  TrendingUp,
  Trophy,
  Clapperboard,
  Cpu,
  Gamepad2,
  BarChart3,
  Zap,
  Flame,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Clapperboard,
  Cpu,
  Gamepad2,
  BarChart3,
  Zap,
  Flame,
  TrendingUp,
};

interface TrendGameEvent {
  id: string;
  trendTitle: string;
  category: string;
  modalTitle: string;
  modalMessage: string;
  modalIcon: string;
  modalColor: string;
  gameModifier?: {
    enemySpeedMult?: number;
    playerDamageMult?: number;
    spawnRateMult?: number;
    xpMult?: number;
    fireBulletsOnly?: boolean;
    noPowerups?: boolean;
  };
}

interface TrendsResponse {
  events: TrendGameEvent[];
  trends: { title: string; traffic: string; pubDate: string }[];
  timestamp: string;
}

export default function TrendsModal({ onApplyModifier }: { onApplyModifier?: (mod: TrendGameEvent["gameModifier"]) => void }) {
  const [events, setEvents] = useState<TrendGameEvent[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastDismiss = localStorage.getItem("lsa_trends_dismissed");
    if (lastDismiss === today) {
      setLoading(false);
      return;
    }

    fetch("/api/trends")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TrendsResponse | null) => {
        if (data && data.events.length > 0) {
          setEvents(data.events);
          setVisible(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function dismiss() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("lsa_trends_dismissed", today);
    setDismissed(true);
    setVisible(false);
  }

  function nextEvent() {
    if (currentIdx < events.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      dismiss();
    }
  }

  function handleApply() {
    const ev = events[currentIdx];
    if (ev?.gameModifier && onApplyModifier) {
      onApplyModifier(ev.gameModifier);
    }
    nextEvent();
  }

  if (!visible || events.length === 0 || dismissed) return null;

  const ev = events[currentIdx];
  const mod = ev.gameModifier;
  const Icon = ICON_MAP[ev.modalIcon] ?? TrendingUp;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "92%",
          maxWidth: 380,
          background: "linear-gradient(145deg, #1a0a30 0%, #0d0520 100%)",
          border: `2px solid ${ev.modalColor}55`,
          borderRadius: 16,
          padding: "28px 24px 20px",
          textAlign: "center",
          boxShadow: `0 0 60px ${ev.modalColor}22, 0 8px 32px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Close / skip */}
        <button
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 10,
            right: 14,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.35)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
          }}
        >
          <X size={18} />
        </button>

        {/* Trending badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: `${ev.modalColor}18`,
            border: `1px solid ${ev.modalColor}40`,
            borderRadius: 20,
            padding: "4px 12px",
            marginBottom: 14,
            fontSize: 10,
            fontWeight: 700,
            color: ev.modalColor,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: "monospace",
          }}
        >
          <TrendingUp size={12} /> TRENDING
        </div>

        {/* Icon */}
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}>
          <Icon size={42} color={ev.modalColor} strokeWidth={1.5} />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: ev.modalColor,
            fontFamily: "monospace",
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          {ev.modalTitle}
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.6,
            marginBottom: 16,
            fontFamily: "monospace",
            whiteSpace: "pre-line",
          }}
        >
          {ev.modalMessage}
        </div>

        {/* Modifier badges */}
        {mod && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 18 }}>
            {mod.xpMult && mod.xpMult > 1 && (
              <span style={badgeStyle("#2ecc71")}>XP x{mod.xpMult}</span>
            )}
            {mod.playerDamageMult && mod.playerDamageMult > 1 && (
              <span style={badgeStyle("#e74c3c")}>DMG x{mod.playerDamageMult}</span>
            )}
            {mod.enemySpeedMult && mod.enemySpeedMult > 1 && (
              <span style={badgeStyle("#f39c12")}>Inimigos x{mod.enemySpeedMult}</span>
            )}
            {mod.spawnRateMult && mod.spawnRateMult > 1 && (
              <span style={badgeStyle("#e67e22")}>Spawn x{mod.spawnRateMult}</span>
            )}
            {mod.noPowerups && (
              <span style={badgeStyle("#e74c3c")}>Sem Power-ups</span>
            )}
            {mod.fireBulletsOnly && (
              <span style={badgeStyle("#ff6600")}>So Balas de Fogo</span>
            )}
          </div>
        )}

        {/* Pagination */}
        {events.length > 1 && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
            {events.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentIdx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === currentIdx ? ev.modalColor : "rgba(255,255,255,0.2)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={dismiss}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "monospace",
              letterSpacing: 1,
            }}
          >
            Ignorar
          </button>
          {mod && (
            <button
              onClick={handleApply}
              style={{
                flex: 2,
                padding: "10px 0",
                borderRadius: 8,
                border: `1px solid ${ev.modalColor}66`,
                background: `linear-gradient(135deg, ${ev.modalColor}30, ${ev.modalColor}15)`,
                color: ev.modalColor,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "monospace",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {currentIdx < events.length - 1 ? "Aplicar & Proximo" : "Aplicar & Jogar"}
            </button>
          )}
          {!mod && (
            <button
              onClick={nextEvent}
              style={{
                flex: 2,
                padding: "10px 0",
                borderRadius: 8,
                border: `1px solid ${ev.modalColor}66`,
                background: `linear-gradient(135deg, ${ev.modalColor}30, ${ev.modalColor}15)`,
                color: ev.modalColor,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "monospace",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {currentIdx < events.length - 1 ? "Proximo" : "Entendido"}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

function badgeStyle(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "monospace",
    letterSpacing: 1,
    color,
    background: `${color}18`,
    border: `1px solid ${color}40`,
  };
}
