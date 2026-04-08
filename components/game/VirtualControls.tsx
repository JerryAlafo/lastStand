"use client";

import { useRef, useState, useEffect } from "react";
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
  const [screenSize, setScreenSize] = useState<"normal" | "small" | "tiny">("normal");
  
  const DEAD = 8;
  
  const sizes = {
    normal: {
      baseR: 60, handleR: 26, ultSize: 72, dashSize: 58,
      bottomOffset: 120, leftOffset: 35, rightOffset: 28,
      pauseTop: 14, pauseSize: 42,
      buttonGap: 16,
    },
    small: {
      baseR: 50, handleR: 20, ultSize: 58, dashSize: 48,
      bottomOffset: 100, leftOffset: 28, rightOffset: 22,
      pauseTop: 12, pauseSize: 38,
      buttonGap: 12,
    },
    tiny: {
      baseR: 40, handleR: 16, ultSize: 48, dashSize: 40,
      bottomOffset: 85, leftOffset: 20, rightOffset: 16,
      pauseTop: 45, pauseSize: 32,
      buttonGap: 8,
    },
  };

  const s = sizes[screenSize];

  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w <= 360 || h <= 700) {
        setScreenSize("tiny");
      } else if (w <= 400 || h <= 780) {
        setScreenSize("small");
      } else {
        setScreenSize("normal");
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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
    const clamp = Math.min(dist, s.baseR);
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
          bottom: s.bottomOffset,
          left: s.leftOffset,
          width: s.baseR * 2,
          height: s.baseR * 2,
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
            width: s.handleR * 2,
            height: s.handleR * 2,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(123,47,247,0.8), rgba(90,29,212,0.5))",
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
          bottom: s.bottomOffset - 15,
          right: s.rightOffset,
          display: running ? "flex" : "none",
          flexDirection: "column",
          gap: s.buttonGap,
          alignItems: "center",
          zIndex: 20,
        }}
      >
        {/* ULT button */}
        <div style={{ position: "relative", width: s.ultSize, height: s.ultSize }}>
          {/* Charge ring */}
          <svg
            width={s.ultSize}
            height={s.ultSize}
            style={{
              position: "absolute",
              inset: 0,
              transform: "rotate(-90deg)",
            }}
          >
            <circle
              cx={s.ultSize / 2}
              cy={s.ultSize / 2}
              r={s.ultSize / 2 - 4}
              fill="none"
              stroke="rgba(255,220,0,0.15)"
              strokeWidth="3"
            />
            <circle
              cx={s.ultSize / 2}
              cy={s.ultSize / 2}
              r={s.ultSize / 2 - 4}
              fill="none"
              stroke={ultReady ? "#ffd700" : "rgba(255,220,0,0.5)"}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * (s.ultSize / 2 - 4)}`}
              strokeDashoffset={`${2 * Math.PI * (s.ultSize / 2 - 4) * (1 - ultPct)}`}
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
              inset: screenSize === "tiny" ? 4 : 6,
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
              fontSize: screenSize === "tiny" ? 16 : 22,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: ultReady ? "0 0 20px rgba(255,215,0,0.6)" : "none",
              transition: "all 0.2s",
              touchAction: "none",
            }}
          >
            <Zap size={screenSize === "tiny" ? 16 : 22} />
          </button>
        </div>

        {/* DASH button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onDash();
          }}
          style={{
            width: s.dashSize,
            height: s.dashSize,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(123,47,247,0.75), rgba(90,29,212,0.45))",
            border: "2px solid rgba(123,47,247,0.55)",
            color: "#fff",
            fontSize: screenSize === "tiny" ? 9 : 12,
            fontWeight: 800,
            fontFamily: "monospace",
            letterSpacing: 1,
            cursor: "pointer",
            boxShadow: "0 0 14px rgba(123,47,247,0.4)",
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
            position: "absolute", top: s.pauseTop, right: 12, zIndex: 20,
            width: s.pauseSize, height: s.pauseSize, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            touchAction: "none",
          }}
        ><Pause size={screenSize === "tiny" ? 14 : 18} /></button>
      )}
    </>
  );
}
