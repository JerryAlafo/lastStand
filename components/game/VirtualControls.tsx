"use client";

import { useRef, useState } from "react";
import { Zap, Pause } from "lucide-react";

export default function VirtualControls({
  ultReady,
  ultActive,
  ultCharge,
  onUlt,
  onDash,
  onPause,
  running,
}: {
  ultReady: boolean;
  ultActive: boolean;
  ultCharge: number;
  onUlt: () => void;
  onDash: () => void;
  onPause: () => void;
  running: boolean;
}) {
  const joyRef = useRef<{ ox: number; oy: number; id: number } | null>(null);
  const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });
  const BASE_R = 60;
  const HANDLE_R = 26;
  const DEAD = 8;

  function setKeys(dx: number, dy: number) {
    const w = window as unknown as Record<string, unknown>;
    const k = w.__keys as Record<string, boolean> | undefined;
    if (!k) return;
    k["KeyW"] = dy < -DEAD;
    k["KeyS"] = dy > DEAD;
    k["KeyA"] = dx < -DEAD;
    k["KeyD"] = dx > DEAD;
  }

  function clearKeys() {
    const w = window as unknown as Record<string, unknown>;
    const k = w.__keys as Record<string, boolean> | undefined;
    if (!k) return;
    ["KeyW", "KeyS", "KeyA", "KeyD"].forEach((key) => {
      k[key] = false;
    });
  }

  function onStart(e: React.TouchEvent) {
    e.preventDefault();
    const t = e.changedTouches[0];
    joyRef.current = { ox: t.clientX, oy: t.clientY, id: t.identifier };
  }

  function onMove(e: React.TouchEvent) {
    e.preventDefault();
    if (!joyRef.current) return;
    const t = Array.from(e.changedTouches).find(
      (c) => c.identifier === joyRef.current!.id,
    );
    if (!t) return;
    const dx = t.clientX - joyRef.current.ox;
    const dy = t.clientY - joyRef.current.oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamp = Math.min(dist, BASE_R);
    const nx = dist > 0 ? (dx / dist) * clamp : 0;
    const ny = dist > 0 ? (dy / dist) * clamp : 0;
    setJoyPos({ x: nx, y: ny });
    setKeys(dx, dy);
  }

  function onEnd(e: React.TouchEvent) {
    e.preventDefault();
    joyRef.current = null;
    setJoyPos({ x: 0, y: 0 });
    clearKeys();
  }

  const ultPct = Math.min(ultCharge / 15, 1);

  return (
    <>
      {/* Joystick — bottom left */}
      <div
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        style={{
          position: "absolute",
          bottom: 110,
          left: 30,
          width: BASE_R * 2,
          height: BASE_R * 2,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "2px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(6px)",
          touchAction: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(123,47,247,0.2)",
          zIndex: 20,
          userSelect: "none",
        }}
      >
        {/* Handle */}
        <div
          style={{
            position: "absolute",
            width: HANDLE_R * 2,
            height: HANDLE_R * 2,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(170,102,255,0.7), rgba(123,47,247,0.4))",
            border: "1.5px solid rgba(255,255,255,0.35)",
            boxShadow: "0 0 12px rgba(123,47,247,0.5)",
            transform: `translate(${joyPos.x}px, ${joyPos.y}px)`,
            transition: joyRef.current ? "none" : "transform 0.15s ease",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Action buttons — bottom right (only while game is running) */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          right: 24,
          display: running ? "flex" : "none",
          flexDirection: "column",
          gap: 14,
          alignItems: "center",
          zIndex: 20,
        }}
      >
        {/* ULT button */}
        <div style={{ position: "relative", width: 72, height: 72 }}>
          {/* Charge ring */}
          <svg
            width="72"
            height="72"
            style={{
              position: "absolute",
              inset: 0,
              transform: "rotate(-90deg)",
            }}
          >
            <circle
              cx="36"
              cy="36"
              r="32"
              fill="none"
              stroke="rgba(255,220,0,0.15)"
              strokeWidth="4"
            />
            <circle
              cx="36"
              cy="36"
              r="32"
              fill="none"
              stroke={ultReady ? "#ffd700" : "rgba(255,220,0,0.5)"}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - ultPct)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.3s" }}
            />
          </svg>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (ultReady) onUlt();
            }}
            style={{
              position: "absolute",
              inset: 6,
              borderRadius: "50%",
              background: ultActive
                ? "radial-gradient(circle, #fff8c0, #ffd700)"
                : ultReady
                  ? "radial-gradient(circle, #ffe566, #e6a800)"
                  : "rgba(255,215,0,0.12)",
              border: ultReady
                ? "2px solid #ffd700"
                : "2px solid rgba(255,215,0,0.3)",
              color: ultReady ? "#000" : "rgba(255,215,0,0.5)",
              fontSize: 22,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: ultReady ? "0 0 20px rgba(255,215,0,0.6)" : "none",
              transition: "all 0.2s",
              touchAction: "none",
            }}
          >
            <Zap size={22} />
          </button>
        </div>

        {/* DASH button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onDash();
          }}
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(0,195,255,0.6), rgba(0,100,200,0.35))",
            border: "2px solid rgba(0,195,255,0.45)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "monospace",
            letterSpacing: 1,
            cursor: "pointer",
            boxShadow: "0 0 14px rgba(0,195,255,0.35)",
            touchAction: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          DASH
        </button>
      </div>

      {/* Top-right: pause button while running */}
      {running && (
        <button
          onTouchStart={(e) => { e.preventDefault(); onPause(); }}
          style={{
            position: "absolute", top: 14, right: 14, zIndex: 20,
            width: 42, height: 42, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            touchAction: "none",
          }}
        ><Pause size={18} /></button>
      )}
    </>
  );
}
