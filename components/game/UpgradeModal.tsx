"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { UpgradeCard, pickUpgradeOptions, RARITY_COLORS, RARITY_BORDER } from "@/lib/upgradeCards";
import {
  Flame, Heart, Zap, Crosshair, Wind, ShieldCheck,
  RefreshCw, Star, Magnet, Swords, RotateCw, Target,
} from "lucide-react";

const UPGRADE_ICONS: Record<string, React.ReactNode> = {
  fire_bullets:  <Flame       size={36} />,
  regen:         <Heart       size={36} />,
  damage_aura:   <Zap         size={36} />,
  triple_shot:   <Target      size={36} />,
  speed_boost:   <Wind        size={36} />,
  extra_hp:      <Heart       size={36} />,
  fast_reload:   <RefreshCw   size={36} />,
  piercing:      <Crosshair   size={36} />,
  magnet:        <Magnet      size={36} />,
  double_xp:     <Star        size={36} />,
  blast_charge:  <RotateCw    size={36} />,
  shield_start:  <ShieldCheck size={36} />,
};

interface Props {
  wave: number;
  upgrades: string[];
  onPick: (id: string) => void;
  onSkip?: () => void;
}

export default function UpgradeModal({ wave, upgrades, onPick, onSkip }: Props) {
  const options = useMemo(() => pickUpgradeOptions(upgrades), [wave]); // eslint-disable-line
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onSkip?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onSkip]);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "rgba(5,0,20,0.88)", backdropFilter: "blur(18px)",
    }}>
      <div style={{ position: "absolute", top: 20, right: 20, fontSize: 24, fontWeight: 900, color: countdown <= 2 ? "#e74c3c" : "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
        {countdown}s
      </div>
      <div style={{ fontSize: 13, letterSpacing: 3, color: "rgba(200,150,255,0.7)", textTransform: "uppercase", marginBottom: 8, fontFamily: "monospace" }}>
        Wave {wave - 1} concluída
      </div>
      <div style={{ fontSize: "clamp(18px,5vw,28px)", fontWeight: 900, color: "#fff", marginBottom: 6, fontFamily: "monospace", letterSpacing: 2 }}>
        ESCOLHE UM UPGRADE
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 32, fontFamily: "monospace" }}>
        O upgrade escolhido dura toda a partida
      </div>

      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center",
        padding: "0 16px", maxWidth: 720, width: "100%",
      }}>
        {options.map((card: UpgradeCard) => (
          <button
            key={card.id}
            onClick={() => { if (timerRef.current) clearInterval(timerRef.current); onPick(card.id); }}
            style={{
              flex: "1 1 180px", maxWidth: 220, padding: "24px 20px",
              background: RARITY_COLORS[card.rarity],
              border: `1px solid ${RARITY_BORDER[card.rarity]}`,
              borderRadius: 16, cursor: "pointer", textAlign: "center",
              transition: "transform 0.15s, box-shadow 0.15s",
              backdropFilter: "blur(8px)",
              fontFamily: "inherit",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-6px) scale(1.03)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 30px ${RARITY_BORDER[card.rarity]}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>{UPGRADE_ICONS[card.id]}</div>
            <div style={{ fontSize: "clamp(13px,3vw,16px)", fontWeight: 800, color: "#fff", marginBottom: 6 }}>{card.name}</div>
            <div style={{ fontSize: "clamp(11px,2.5vw,13px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.4, marginBottom: 12 }}>{card.desc}</div>
            <div style={{
              display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 2,
              padding: "3px 10px", borderRadius: 10, textTransform: "uppercase",
              background: card.rarity === "épico" ? "rgba(140,0,255,0.3)" : card.rarity === "raro" ? "rgba(0,100,255,0.3)" : "rgba(255,255,255,0.1)",
              color: card.rarity === "épico" ? "#cc88ff" : card.rarity === "raro" ? "#88bbff" : "rgba(255,255,255,0.5)",
              border: `1px solid ${RARITY_BORDER[card.rarity]}`,
            }}>
              {card.rarity}
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 32, fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
        upgrades activos: {upgrades.length}
      </div>
    </div>
  );
}
