"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, Avatar } from "@mui/material";
import {
  Zap,
  Bomb,
  Shield,
  TrendingUp,
  Pause,
  Play,
  LogOut,
  Swords,
  Trophy,
  RotateCcw,
  Settings,
  X,
  UserCog,
  BarChart2,
  Heart,
  Home,
  Skull,
  Mail,
  MessageCircle,
  Camera,
  Briefcase,
  ExternalLink,
  ArrowLeft,
  Phone,
} from "lucide-react";
import { signOut } from "next-auth/react";

// Lerp between two RGBA arrays based on t (0=night, 1=day)
function lerpRgba(night: number[], day: number[], t: number): string {
  const r = Math.round(night[0] + (day[0] - night[0]) * t);
  const g = Math.round(night[1] + (day[1] - night[1]) * t);
  const b = Math.round(night[2] + (day[2] - night[2]) * t);
  const a = +(night[3] + (day[3] - night[3]) * t).toFixed(2);
  return `rgba(${r},${g},${b},${a})`;
}

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: color,
        border: active
          ? "2.5px solid #fff"
          : "2px solid rgba(255,255,255,0.15)",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        boxShadow: active ? `0 0 10px ${color}` : "none",
        transform: active ? "scale(1.18)" : "scale(1)",
        transition: "all 0.15s",
      }}
    />
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 2,
          color: "rgba(170,102,255,0.65)",
          textTransform: "uppercase",
          marginBottom: 7,
          fontFamily: "monospace",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}

function CharacterPreview({
  skin,
  shirt,
  shorts,
  shoe,
}: {
  skin: string;
  shirt: string;
  shorts: string;
  shoe: string;
}) {
  return (
    <svg
      width="100"
      height="200"
      viewBox="0 0 100 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.5))" }}
    >
      {/* Shadow */}
      <ellipse cx="50" cy="193" rx="26" ry="6" fill="rgba(0,0,0,0.22)" />
      {/* Legs */}
      <rect x="27" y="122" width="18" height="52" rx="7" fill={skin} />
      <rect x="55" y="122" width="18" height="52" rx="7" fill={skin} />
      {/* Shoes */}
      <ellipse cx="36" cy="176" rx="16" ry="8" fill={shoe} />
      <ellipse cx="64" cy="176" rx="16" ry="8" fill={shoe} />
      {/* Shorts */}
      <rect x="23" y="96" width="54" height="32" rx="7" fill={shorts} />
      {/* Torso */}
      <rect x="25" y="52" width="50" height="50" rx="9" fill={shirt} />
      {/* Arms */}
      <rect x="6" y="54" width="19" height="42" rx="8" fill={shirt} />
      <rect x="75" y="54" width="19" height="42" rx="8" fill={shirt} />
      {/* Hands */}
      <ellipse cx="15" cy="99" rx="9" ry="8" fill={skin} />
      <ellipse cx="85" cy="99" rx="9" ry="8" fill={skin} />
      {/* Neck */}
      <rect x="42" y="40" width="16" height="16" rx="5" fill={skin} />
      {/* Head */}
      <circle cx="50" cy="26" r="26" fill={skin} />
      {/* Eyes */}
      <circle cx="40" cy="23" r="5" fill="white" />
      <circle cx="60" cy="23" r="5" fill="white" />
      <circle cx="41" cy="24" r="2.8" fill="#1a1a2e" />
      <circle cx="61" cy="24" r="2.8" fill="#1a1a2e" />
      {/* Smile */}
      <path
        d="M40 38 Q50 45 60 38"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ── Virtual joystick helper ──────────────────────────────────────────────────
function VirtualControls({
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

export default function HUD() {
  const router = useRouter();
  const { data: session } = useSession();
  const username = session?.user?.username ?? "";
  const initials = username ? username.slice(0, 2).toUpperCase() : "??";
  const {
    hp,
    maxHp,
    score,
    kills,
    wave,
    xp,
    xpNext,
    activeEffects,
    running,
    gameOver,
    waveMessage,
    setRunning,
    reset,
    setWaveMessage,
  } = useGameStore();

  // Track if game has ever been started (to distinguish pause from main menu)
  const [hasEverStarted, setHasEverStarted] = useState(false);
  useEffect(() => {
    if (running) setHasEverStarted(true);
  }, [running]);

  function goToMenu() {
    reset(); // sets running: true in store
    setRunning(false); // immediately override to false → show main menu
    setHasEverStarted(false);
  }

  // Mobile detection via (pointer: coarse) — correctly identifies touch-primary devices.
  // Never uses "ontouchstart" which gives false-positives on Windows touch-screen PCs.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const check = () => setIsMobile(mq.matches);
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  // Day/night value (0=night, 1=day) synced from GameScene via window.__dayTime
  const [dayTime, setDayTime] = useState(0);
  // Ultimate ability state
  const [ultCharge, setUltCharge] = useState(0);
  const [ultReady, setUltReady] = useState(false);
  const [ultActive, setUltActive] = useState(false);
  const dayRafRef = useRef<number>();
  const dayFrameRef = useRef(0);
  useEffect(() => {
    function tick() {
      dayFrameRef.current++;
      if (dayFrameRef.current % 20 === 0) {
        const w = window as unknown as Record<string, unknown>;
        const t = (w.__dayTime as number) ?? 0;
        setDayTime(t);
        const ult = w.__ult as
          | { charge: number; needed: number; active: boolean }
          | undefined;
        if (ult) {
          setUltCharge(ult.charge);
          setUltReady(ult.charge >= ult.needed);
          setUltActive(ult.active);
        }
      }
      dayRafRef.current = requestAnimationFrame(tick);
    }
    dayRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(dayRafRef.current!);
  }, []);

  // HP flash vignette on damage / heal
  const prevHpRef = useRef(hp);
  const [hpFlash, setHpFlash] = useState<"damage" | "heal" | null>(null);
  const hpFlashTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (prevHpRef.current !== hp) {
      const type = hp < prevHpRef.current ? "damage" : "heal";
      prevHpRef.current = hp;
      clearTimeout(hpFlashTimerRef.current);
      setHpFlash(type);
      hpFlashTimerRef.current = setTimeout(() => setHpFlash(null), 500);
    }
  }, [hp]);

  const [showSettings, setShowSettings] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameMsg, setRenameMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [cfg, setCfg] = useState(() => {
    if (typeof window === "undefined")
      return {
        skin: "#c68642",
        shirt: "#4a90d9",
        shorts: "#1a2255",
        shoe: "#111111",
      };
    try {
      return {
        skin: "#c68642",
        shirt: "#4a90d9",
        shorts: "#1a2255",
        shoe: "#111111",
        ...JSON.parse(localStorage.getItem("lsa_player_settings") ?? "{}"),
      };
    } catch {
      return {
        skin: "#c68642",
        shirt: "#4a90d9",
        shorts: "#1a2255",
        shoe: "#111111",
      };
    }
  });

  function saveSettings(next: typeof cfg) {
    setCfg(next);
    localStorage.setItem("lsa_player_settings", JSON.stringify(next));
    window.dispatchEvent(new Event("playerSettingsChanged"));
  }

  const msgTimer = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (waveMessage) {
      clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setWaveMessage(""), 1800);
    }
  }, [waveMessage]);

  const savedRef = useRef(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user?.username) return;
    (async () => {
      const res = await fetch("/api/scores/me").catch(() => null);
      if (!res?.ok) return;
      const json = (await res.json()) as { scores: { score: number }[] };
      setBest(json.scores?.[0]?.score ?? 0);
    })();
  }, [session?.user?.username]);

  useEffect(() => {
    if (!session?.user?.username) return;
    if (!gameOver) {
      savedRef.current = false;
      return;
    }
    if (savedRef.current) return;
    savedRef.current = true;
    fetch("/api/scores/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ score, wave, kills }),
    }).catch(() => undefined);
  }, [gameOver, session?.user?.username, score, wave, kills]);

  const effectIcons: Record<string, JSX.Element> = {
    rapidfire: <Zap size={14} color="#ffd700" />,
    multishot: <Bomb size={14} color="#ff4500" />,
    shield: <Shield size={14} color="#00ff88" />,
    speed: <TrendingUp size={14} color="#00bfff" />,
  };

  // Dynamic colours based on dayTime
  const t = dayTime;
  const topBarBg = lerpRgba([0, 0, 15, 0.8], [30, 120, 200, 0.55], t);
  const cardBg = lerpRgba([5, 0, 20, 0.78], [180, 215, 255, 0.55], t);
  const cardBorder = lerpRgba([255, 255, 255, 0.08], [255, 255, 255, 0.3], t);
  const textPrimary = t > 0.5 ? "#0a0020" : "#ffffff";
  const textSecondary = t > 0.5 ? "rgba(0,0,30,0.6)" : "rgba(255,255,255,0.5)";

  return (
    <>
      {/* ── HP flash vignette (damage = red, heal = green) ── */}
      {hpFlash && (
        <div
          key={`flash-${Date.now()}`}
          style={{
            position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none",
            background: hpFlash === "damage"
              ? "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(231,76,60,0.55) 100%)"
              : "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(46,204,113,0.4) 100%)",
            animation: "hpVignetteFade 0.5s ease-out forwards",
          }}
        />
      )}
      <style>{`
        @keyframes hpVignetteFade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* ── Top bar ── */}
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
          <div
            style={{
              color: textSecondary,
              fontSize: 9,
              letterSpacing: 2,
              transition: "color 1s",
            }}
          >
            WAVE
          </div>
          <div
            style={{
              color: "#f39c12",
              fontSize: isMobile ? 18 : 24,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 0 10px #f39c1288",
            }}
          >
            {wave}
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              color: textSecondary,
              fontSize: 9,
              letterSpacing: 2,
              transition: "color 1s",
            }}
          >
            SCORE
          </div>
          <div
            style={{
              color: textPrimary,
              fontSize: isMobile ? 17 : 22,
              fontWeight: 700,
              lineHeight: 1,
              transition: "color 1s",
            }}
          >
            {score}
          </div>
        </div>

        {/* Kills */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              color: textSecondary,
              fontSize: 9,
              letterSpacing: 2,
              transition: "color 1s",
            }}
          >
            KILLS
          </div>
          <div
            style={{
              color: "#e74c3c",
              fontSize: isMobile ? 17 : 22,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 0 8px #e74c3c88",
            }}
          >
            {kills}
          </div>
        </div>

        {/* Spacer for buttons on right (desktop only) */}
        {!isMobile && <div style={{ width: 180 }} />}
      </div>

      {/* ── Pause / Logout buttons — desktop only, during active gameplay ── */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 16,
          display: !isMobile && running ? "flex" : "none",
          gap: 1,
          zIndex: 20,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={() => setRunning(!running)}
          variant="contained"
          startIcon={running ? <Pause size={14} /> : <Play size={14} />}
          sx={{
            bgcolor: running
              ? "rgba(243,156,18,0.85)"
              : "rgba(46,204,113,0.85)",
            backdropFilter: "blur(6px)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
            textTransform: "none",
            borderRadius: 2,
            "&:hover": { bgcolor: running ? "#e67e22" : "#27ae60" },
          }}
        >
          {running ? "Pausar" : "Resumir"}
        </Button>

        <Button
          onClick={() => {
            setShowSettings(true);
            setRunning(false);
          }}
          variant="contained"
          startIcon={<Settings size={14} />}
          sx={{
            bgcolor: "rgba(100,100,120,0.75)",
            backdropFilter: "blur(6px)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
            textTransform: "none",
            borderRadius: 2,
            "&:hover": { bgcolor: "rgba(130,130,160,0.85)" },
          }}
        >
          Config
        </Button>

        {session?.user?.username && (
          <Button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
            variant="contained"
            startIcon={<LogOut size={14} />}
            sx={{
              bgcolor: "rgba(231,76,60,0.82)",
              backdropFilter: "blur(6px)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "monospace",
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { bgcolor: "#c0392b" },
            }}
          >
            Sair
          </Button>
        )}
      </Box>

      {/* ── User card (desktop only) ── */}
      {session?.user?.username && !isMobile && (
        <div
          style={{
            position: "absolute",
            top: 62,
            right: 16,
            width: 240,
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 14,
            padding: "12px 14px",
            fontFamily: "monospace",
            backdropFilter: "blur(10px)",
            transition: "background 1s ease, border-color 1s ease",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor:
                  t > 0.5 ? "rgba(0,80,200,0.25)" : "rgba(0,229,255,0.18)",
                border: `1px solid ${t > 0.5 ? "rgba(0,100,255,0.4)" : "rgba(0,229,255,0.35)"}`,
                color: textPrimary,
                fontWeight: 800,
                fontSize: 14,
                transition: "all 1s",
              }}
            >
              {initials}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: textPrimary,
                  lineHeight: 1.1,
                  transition: "color 1s",
                }}
              >
                {username}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: textSecondary, transition: "color 1s" }}
              >
                desde{" "}
                {session.user.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString()
                  : "—"}
              </Typography>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 11,
                  color: textSecondary,
                  transition: "color 1s",
                }}
              >
                Melhor
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#7b2ff7" }}>
                {best ?? "—"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 11,
                  color: textSecondary,
                  transition: "color 1s",
                }}
              >
                Kills (sessão)
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#e74c3c" }}>
                {kills}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── XP bar ── */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 16,
          right: 16,
          height: 3,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 2,
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: "linear-gradient(90deg, #7b2ff7, #00c3ff)",
            width: `${Math.min(100, (xp / xpNext) * 100).toFixed(0)}%`,
            transition: "width 0.2s",
            boxShadow: "0 0 6px #7b2ff788",
          }}
        />
      </div>

      {/* ── Active effects ── */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 16,
          display: "flex",
          gap: 5,
        }}
      >
        {Object.entries(activeEffects).map(([k, v]) =>
          effectIcons[k] && (v || 0) > 0 ? (
            <div
              key={k}
              style={{
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)",
                color: "#fff",
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                border: "0.5px solid rgba(255,255,255,0.2)",
                fontFamily: "monospace",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {effectIcons[k]} {Math.ceil((v || 0) / 60)}s
            </div>
          ) : null,
        )}
      </div>

      {/* ── Wave message ── */}
      {waveMessage && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#f39c12",
            fontSize: 30,
            fontWeight: 700,
            fontFamily: "monospace",
            textShadow: "0 0 20px #f39c12",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {waveMessage}
        </div>
      )}

      {/* ── Ultimate ability button (desktop only) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: isMobile ? "none" : "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
          pointerEvents: "auto",
        }}
      >
        {/* Charge bar */}
        <div
          style={{
            width: 180,
            height: 5,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round((ultCharge / 15) * 100)}%`,
              background: ultReady
                ? "linear-gradient(90deg,#ffdd00,#ff8800)"
                : "linear-gradient(90deg,#7b2ff7,#00c3ff)",
              borderRadius: 3,
              transition: "width 0.2s, background 0.5s",
              boxShadow: ultReady ? "0 0 8px #ffdd00aa" : "none",
            }}
          />
        </div>

        <Button
          onClick={() => {
            const w = window as unknown as Record<string, () => void>;
            // trigger via key simulation
            window.dispatchEvent(
              new KeyboardEvent("keydown", { code: "KeyE" }),
            );
            window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyE" }));
          }}
          disabled={!ultReady || ultActive}
          variant="contained"
          sx={{
            background: ultActive
              ? "linear-gradient(135deg,#ff8800,#ffdd00)"
              : ultReady
                ? "linear-gradient(135deg,#ffdd00,#ff6600)"
                : "rgba(255,255,255,0.06)",
            color: ultReady ? "#000" : "rgba(255,255,255,0.35)",
            fontWeight: 800,
            fontFamily: "monospace",
            fontSize: 13,
            letterSpacing: 2,
            textTransform: "none",
            px: 4,
            py: 0.8,
            borderRadius: 2,
            border: ultReady
              ? "1px solid #ffdd00"
              : "1px solid rgba(255,255,255,0.1)",
            boxShadow:
              ultReady && !ultActive ? "0 0 22px rgba(255,220,0,0.55)" : "none",
            animation:
              ultReady && !ultActive
                ? "ultPulse 1s ease-in-out infinite"
                : "none",
            "&:hover": {
              background: ultReady
                ? "linear-gradient(135deg,#ffe033,#ff7700)"
                : undefined,
            },
            "&:disabled": { opacity: ultActive ? 1 : 0.5 },
            transition: "all 0.4s",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {(ultActive || ultReady) && <Zap size={14} />}
            {ultActive
              ? "FÚRIA ACTIVA..."
              : ultReady
                ? "FÚRIA FINAL [E]"
                : `FÚRIA FINAL (${ultCharge}/15)`}
          </span>
        </Button>
      </div>

      {/* ── Settings modal ── */}
      {showSettings && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,10,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: 620,
              maxWidth: "96vw",
              maxHeight: "92vh",
              overflowY: "auto",
              background: "rgba(12,4,28,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "26px 28px 22px",
              boxShadow: "0 0 80px rgba(123,47,247,0.3)",
              fontFamily: "'Inter','Segoe UI',sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Settings size={19} color="#aa66ff" />
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: 0.3,
                  }}
                >
                  Configurações
                </span>
              </div>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setRunning(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.45)",
                  padding: 4,
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Two-column: pickers + preview */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              {/* Left: colour pickers */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 3,
                    color: "rgba(170,102,255,0.6)",
                    textTransform: "uppercase",
                    marginBottom: 14,
                    fontFamily: "monospace",
                  }}
                >
                  Personalizar Personagem
                </div>
                <SettingRow label="Tom de pele">
                  {[
                    "#f1c27d",
                    "#e0ac69",
                    "#c68642",
                    "#d49560",
                    "#8d5524",
                    "#4a2911",
                  ].map((c) => (
                    <Swatch
                      key={c}
                      color={c}
                      active={cfg.skin === c}
                      onClick={() => saveSettings({ ...cfg, skin: c })}
                    />
                  ))}
                </SettingRow>
                <SettingRow label="Camisola">
                  {[
                    "#4a90d9",
                    "#e74c3c",
                    "#2ecc71",
                    "#f39c12",
                    "#9b59b6",
                    "#1abc9c",
                    "#111111",
                    "#e8e8e8",
                  ].map((c) => (
                    <Swatch
                      key={c}
                      color={c}
                      active={cfg.shirt === c}
                      onClick={() => saveSettings({ ...cfg, shirt: c })}
                    />
                  ))}
                </SettingRow>
                <SettingRow label="Calções">
                  {[
                    "#1a2255",
                    "#2c3e50",
                    "#7f0000",
                    "#1a4a1a",
                    "#4a3800",
                    "#220033",
                    "#111111",
                    "#334455",
                  ].map((c) => (
                    <Swatch
                      key={c}
                      color={c}
                      active={cfg.shorts === c}
                      onClick={() => saveSettings({ ...cfg, shorts: c })}
                    />
                  ))}
                </SettingRow>
                <SettingRow label="Sapatilhas">
                  {[
                    "#111111",
                    "#e8e8e8",
                    "#8b4513",
                    "#e74c3c",
                    "#1a1a6a",
                    "#2ecc71",
                  ].map((c) => (
                    <Swatch
                      key={c}
                      color={c}
                      active={cfg.shoe === c}
                      onClick={() => saveSettings({ ...cfg, shoe: c })}
                    />
                  ))}
                </SettingRow>
              </div>

              {/* Right: character preview */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  paddingTop: 24,
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16,
                    padding: "18px 22px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <CharacterPreview
                    skin={cfg.skin}
                    shirt={cfg.shirt}
                    shorts={cfg.shorts}
                    shoe={cfg.shoe}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.3)",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                    }}
                  >
                    Pré-visualização
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.07)",
                margin: "18px 0",
              }}
            />

            {/* Username change */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <UserCog size={16} color="#aa66ff" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  Alterar Username
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value);
                    setRenameMsg(null);
                  }}
                  placeholder={username || "novo_username"}
                  maxLength={20}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  disabled={renameLoading || !newUsername.trim()}
                  onClick={async () => {
                    setRenameLoading(true);
                    setRenameMsg(null);
                    try {
                      const res = await fetch("/api/user/rename", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ newUsername }),
                      });
                      const json = (await res.json()) as {
                        ok?: boolean;
                        error?: string;
                      };
                      if (json.ok) {
                        setRenameMsg({
                          ok: true,
                          text: "Alterado! A fazer logout para atualizar sessão…",
                        });
                        setTimeout(
                          () => signOut({ callbackUrl: "/login" }),
                          1800,
                        );
                      } else {
                        setRenameMsg({
                          ok: false,
                          text: json.error ?? "Erro ao alterar.",
                        });
                      }
                    } finally {
                      setRenameLoading(false);
                    }
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      renameLoading || !newUsername.trim()
                        ? "rgba(123,47,247,0.25)"
                        : "linear-gradient(135deg,#7b2ff7,#00c3ff)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor:
                      renameLoading || !newUsername.trim()
                        ? "not-allowed"
                        : "pointer",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  {renameLoading ? "…" : "Guardar"}
                </button>
              </div>
              {renameMsg && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: renameMsg.ok ? "#2ecc71" : "#ff7070",
                    fontFamily: "monospace",
                  }}
                >
                  {renameMsg.text}
                </div>
              )}
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.07)",
                marginBottom: 16,
              }}
            />

            {/* Contact + close row */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowContact(true);
                }}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "inherit",
                }}
              >
                <Phone size={15} /> Contacto
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setRunning(true);
                }}
                style={{
                  flex: 2,
                  padding: "11px",
                  background: "linear-gradient(135deg,#7b2ff7,#00c3ff)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  letterSpacing: 0.5,
                  fontFamily: "inherit",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact modal ── */}
      {showContact && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,10,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: 480,
              maxWidth: "92vw",
              background: "rgba(12,4,28,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "26px 28px",
              boxShadow: "0 0 80px rgba(123,47,247,0.3)",
              fontFamily: "'Inter','Segoe UI',sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Phone size={18} color="#aa66ff" />
                <span style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>
                  Contacto
                </span>
              </div>
              <button
                onClick={() => {
                  setShowContact(false);
                  setRunning(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.45)",
                  padding: 4,
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Creator card */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 22,
                padding: "18px 0",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#7b2ff7,#00c3ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#fff",
                  margin: "0 auto 12px",
                  boxShadow: "0 0 24px rgba(123,47,247,0.5)",
                }}
              >
                JA
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: 0.5,
                }}
              >
                Jerry Alafo
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 4,
                }}
              >
                Criador · Last Stand Arena
              </div>
            </div>

            {/* Contact items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(
                [
                  {
                    label: "Email",
                    value: "jerryalafo20@gmail.com",
                    href: "mailto:jerryalafo20@gmail.com",
                    color: "#ea4335",
                    glow: "rgba(234,67,53,0.25)",
                    icon: <Mail size={18} />,
                  },
                  {
                    label: "WhatsApp",
                    value: "+258 833 066 530",
                    href: "https://wa.me/258833066530",
                    color: "#25d366",
                    glow: "rgba(37,211,102,0.25)",
                    icon: <MessageCircle size={18} />,
                  },
                  {
                    label: "Instagram",
                    value: "@jerry_org_",
                    href: "https://www.instagram.com/jerry_org_/",
                    color: "#e1306c",
                    glow: "rgba(225,48,108,0.25)",
                    icon: <Camera size={18} />,
                  },
                  {
                    label: "Instagram (trabalhos)",
                    value: "@jerry_org_jobs",
                    href: "https://www.instagram.com/jerry_org_jobs/",
                    color: "#c13584",
                    glow: "rgba(193,53,132,0.25)",
                    icon: <Briefcase size={18} />,
                  },
                ] as {
                  label: string;
                  value: string;
                  href: string;
                  color: string;
                  glow: string;
                  icon: React.ReactNode;
                }[]
              ).map((c) => (
                <a
                  key={c.value}
                  href={c.href}
                  target={c.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 16px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        `${c.color}44`;
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        `0 0 16px ${c.glow}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(255,255,255,0.03)";
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        "none";
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${c.color}18`,
                        border: `1px solid ${c.color}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: c.color,
                        flexShrink: 0,
                      }}
                    >
                      {c.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.35)",
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                          marginBottom: 2,
                          fontFamily: "monospace",
                        }}
                      >
                        {c.label}
                      </div>
                      <div
                        style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}
                      >
                        {c.value}
                      </div>
                    </div>
                    <ExternalLink size={13} color="rgba(255,255,255,0.25)" />
                  </div>
                </a>
              ))}
            </div>

            <button
              onClick={() => {
                setShowContact(false);
                setShowSettings(true);
              }}
              style={{
                marginTop: 18,
                width: "100%",
                padding: "11px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "rgba(255,255,255,0.6)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <ArrowLeft
                size={14}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Voltar às Configurações
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ultPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(255,220,0,0.4); }
          50% { box-shadow: 0 0 30px rgba(255,180,0,0.85); }
        }
      `}</style>

      {/* ── Controls hint ── */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {["WASD mover", "ataque auto", "Q dash", "E fúria"].map((h) => (
          <span
            key={h}
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 10,
              padding: "3px 9px",
              borderRadius: 4,
              border: "0.5px solid rgba(255,255,255,0.15)",
              fontFamily: "monospace",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* ── Pause modal (game was started, now paused) ── */}
      {!running && !gameOver && hasEverStarted && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(5,0,20,0.75)",
            backdropFilter: "blur(14px)",
          }}
        >
          {/* Stats row */}
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "monospace",
              letterSpacing: 2,
              marginBottom: 20,
            }}
          >
            WAVE <span style={{ color: "#f39c12" }}>{wave}</span>
            {" · "}
            <span style={{ color: "#fff" }}>{score} pts</span>
            {" · "}
            <span style={{ color: "#e74c3c" }}>{kills} kills</span>
          </div>

          {/* Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "32px 36px",
              backdropFilter: "blur(20px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 0 60px rgba(123,47,247,0.2)",
              minWidth: 280,
              maxWidth: "90vw",
            }}
          >
            <Pause size={38} color="rgba(200,170,255,0.85)" strokeWidth={1.5} />
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 3,
                fontFamily: "monospace",
                color: "#fff",
              }}
            >
              PAUSADO
            </div>

            {/* User card — mobile only */}
            {isMobile && session?.user?.username && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 14px", background: "rgba(255,255,255,0.05)",
                borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <Avatar sx={{
                  width: 34, height: 34, bgcolor: "rgba(123,47,247,0.25)",
                  border: "1px solid rgba(123,47,247,0.4)",
                  color: "#fff", fontWeight: 800, fontSize: 13,
                }}>
                  {initials}
                </Avatar>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {username}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    Melhor:{" "}<span style={{ color: "#7b2ff7", fontWeight: 700 }}>{best ?? "—"}</span>
                    {" · "}Kills:{" "}<span style={{ color: "#e74c3c", fontWeight: 700 }}>{kills}</span>
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 6,
              }}
            >
              <Button
                onClick={() => setRunning(true)}
                variant="contained"
                fullWidth
                startIcon={<Play size={16} />}
                sx={{
                  background: "linear-gradient(135deg,#2ecc71,#27ae60)",
                  fontFamily: "monospace",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.4,
                  fontSize: 14,
                  boxShadow: "0 0 20px rgba(46,204,113,0.4)",
                  "&:hover": {
                    background: "linear-gradient(135deg,#27ae60,#1e8449)",
                  },
                }}
              >
                Retomar
              </Button>

              <Button
                onClick={() => {
                  setShowSettings(true);
                }}
                variant="outlined"
                fullWidth
                startIcon={<Settings size={16} />}
                sx={{
                  borderColor: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontFamily: "monospace",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.2,
                  fontSize: 13,
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.35)",
                    bgcolor: "rgba(255,255,255,0.06)",
                  },
                }}
              >
                Configurações
              </Button>

              <Button
                onClick={goToMenu}
                variant="outlined"
                fullWidth
                startIcon={<Home size={16} />}
                sx={{
                  borderColor: "rgba(255,100,100,0.3)",
                  color: "rgba(255,160,160,0.85)",
                  fontFamily: "monospace",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.2,
                  fontSize: 13,
                  "&:hover": {
                    borderColor: "rgba(255,100,100,0.5)",
                    bgcolor: "rgba(255,50,50,0.06)",
                  },
                }}
              >
                Menu Principal
              </Button>

              <Button
                onClick={() => signOut({ callbackUrl: "/login" })}
                variant="text"
                fullWidth
                startIcon={<LogOut size={13} />}
                sx={{
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "monospace",
                  textTransform: "none",
                  fontSize: 12,
                  py: 0.8,
                  "&:hover": { color: "rgba(255,255,255,0.55)" },
                }}
              >
                Sair da conta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main menu / Start overlay (first time, or after going to menu) ── */}
      {!running && !gameOver && !hasEverStarted && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(ellipse at 50% 35%, rgba(42,16,80,0.97) 0%, rgba(14,5,32,0.98) 60%, rgba(8,2,20,0.99) 100%)",
            backdropFilter: "blur(16px)",
            zIndex: 10,
          }}
        >
          {/* Glow blobs */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "10%",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(123,47,247,0.18) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "8%",
              width: 260,
              height: 260,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(231,76,60,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <Swords
            size={52}
            color="#e74c3c"
            strokeWidth={1.5}
            style={{
              marginBottom: 18,
              filter: "drop-shadow(0 0 16px #e74c3c88)",
              position: "relative",
              zIndex: 1,
            }}
          />
          <div
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: 3,
              fontFamily: "monospace",
              marginBottom: 4,
              position: "relative",
              zIndex: 1,
              background: "linear-gradient(135deg,#fff,#dd99ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Last Stand Arena
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              color: "rgba(200,150,255,0.6)",
              textTransform: "uppercase",
              fontFamily: "monospace",
              marginBottom: 22,
              position: "relative",
              zIndex: 1,
            }}
          >
            por Jerry Alafo
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: isMobile ? 13 : 12,
              marginBottom: 30,
              textAlign: "center",
              lineHeight: 2.2,
              fontFamily: "monospace",
              position: "relative",
              zIndex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "12px 24px",
              backdropFilter: "blur(8px)",
            }}
          >
            {isMobile ? (
              <>
                Sobrevive às waves de inimigos
                <br />
                <span style={{ color: "#7b2ff7" }}>Joystick</span> para mover ·{" "}
                <span style={{ color: "#f39c12" }}>ataque automático</span>
                <br />
                <span style={{ color: "#2ecc71" }}>DASH</span> para esquivar ·{" "}
                <span
                  style={{
                    color: "#ffdd00",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    verticalAlign: "middle",
                  }}
                >
                  <Zap size={11} />
                </span>{" "}
                fúria final (15 kills)
              </>
            ) : (
              <>
                Sobrevive às waves de inimigos
                <br />
                <span style={{ color: "#7b2ff7" }}>WASD</span> mover ·{" "}
                <span style={{ color: "#f39c12" }}>ataque automático</span> ·{" "}
                <span style={{ color: "#2ecc71" }}>Q</span> dash ·{" "}
                <span style={{ color: "#ffdd00" }}>E</span> fúria final (15
                kills)
              </>
            )}
          </div>
          <Button
            onClick={() => reset()}
            variant="contained"
            startIcon={<Swords size={18} />}
            sx={{
              background: "linear-gradient(135deg, #c0392b, #e74c3c)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 2,
              fontFamily: "monospace",
              px: 7,
              py: 2,
              borderRadius: 2,
              textTransform: "none",
              boxShadow: "0 0 32px rgba(231,76,60,0.55)",
              position: "relative",
              zIndex: 1,
              "&:hover": {
                background: "linear-gradient(135deg, #a93226, #c0392b)",
                boxShadow: "0 0 44px rgba(231,76,60,0.75)",
              },
            }}
          >
            ENTRAR NA ARENA
          </Button>

          {/* Nav links */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 20,
              position: "relative",
              zIndex: 1,
              justifyContent: "center",
              maxWidth: 420,
            }}
          >
            <button
              onClick={() => router.push("/stats")}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                backdropFilter: "blur(8px)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.6)";
              }}
            >
              <BarChart2 size={13} /> Estatísticas
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "1px solid rgba(255,215,0,0.2)",
                background: "rgba(255,215,0,0.05)",
                color: "rgba(255,215,0,0.7)",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                backdropFilter: "blur(8px)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,215,0,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "#ffd700";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,215,0,0.05)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,215,0,0.7)";
              }}
            >
              <Trophy size={13} /> Leaderboard
            </button>
            <button
              onClick={() => router.push("/donate")}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "1px solid rgba(255,100,150,0.25)",
                background: "rgba(255,80,120,0.06)",
                color: "rgba(255,150,180,0.75)",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                backdropFilter: "blur(8px)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,80,120,0.14)";
                (e.currentTarget as HTMLButtonElement).style.color = "#ff99bb";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,80,120,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,150,180,0.75)";
              }}
            >
              <Heart size={13} /> Apoiar
            </button>
            <button
              onClick={() => { setShowSettings(true); }}
              style={{
                padding: "8px 18px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit", backdropFilter: "blur(8px)", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
            >
              <Settings size={13} /> Config
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                padding: "8px 18px", borderRadius: 8,
                border: "1px solid rgba(231,76,60,0.2)",
                background: "rgba(231,76,60,0.05)",
                color: "rgba(255,120,120,0.6)", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit", backdropFilter: "blur(8px)", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(231,76,60,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#ff8888"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(231,76,60,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,120,120,0.6)"; }}
            >
              <LogOut size={13} /> Sair
            </button>
          </div>

        </div>
      )}

      {/* ── Game Over ── */}
      {gameOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(ellipse at 50% 35%, rgba(50,10,20,0.97) 0%, rgba(14,5,32,0.98) 60%, rgba(8,2,20,0.99) 100%)",
            backdropFilter: "blur(16px)",
            zIndex: 10,
          }}
        >
          {/* Glow blobs */}
          <div
            style={{
              position: "absolute",
              top: "12%",
              right: "10%",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(231,76,60,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              left: "8%",
              width: 240,
              height: 240,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(123,47,247,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              marginBottom: 10,
              filter: "drop-shadow(0 0 20px #e74c3c)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Skull size={isMobile ? 42 : 56} color="#e74c3c" strokeWidth={1.5} />
          </div>
          <div
            style={{
              color: "#e74c3c",
              fontSize: isMobile ? 24 : 32,
              fontWeight: 900,
              fontFamily: "monospace",
              letterSpacing: 3,
              textShadow: "0 0 28px #e74c3c99",
              position: "relative",
              zIndex: 1,
            }}
          >
            ELIMINADO
          </div>

          {/* Score card */}
          <div
            style={{
              margin: "18px 0 6px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: isMobile ? "12px 16px" : "16px 32px",
              backdropFilter: "blur(12px)",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: isMobile ? 14 : 28,
                justifyContent: "center",
                fontFamily: "monospace",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: "#fff" }}>
                  {score}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  pontos
                </div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: "#f39c12" }}
                >
                  {wave}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  wave
                </div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: "#e74c3c" }}
                >
                  {kills}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  kills
                </div>
              </div>
            </div>
            {best != null && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "monospace",
                }}
              >
                Personal best:{" "}
                <span style={{ color: "#7b2ff7", fontWeight: 700 }}>
                  {best}
                </span>
              </div>
            )}
          </div>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              mt: 2,
              px: isMobile ? 1 : 0,
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Button
              onClick={() => reset()}
              variant="contained"
              startIcon={<RotateCcw size={isMobile ? 14 : 16} />}
              sx={{
                background: "linear-gradient(135deg, #c0392b, #e74c3c)",
                color: "#fff",
                fontSize: isMobile ? 12 : 14,
                fontWeight: 700,
                letterSpacing: 1,
                fontFamily: "monospace",
                px: isMobile ? 2.5 : 5,
                py: isMobile ? 1.2 : 1.5,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: "0 0 20px rgba(231,76,60,0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #a93226, #c0392b)",
                },
              }}
            >
              Tentar de novo
            </Button>
            <Button
              onClick={() => router.push("/leaderboard")}
              variant="outlined"
              startIcon={<Trophy size={isMobile ? 14 : 16} />}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.2)",
                fontSize: isMobile ? 12 : 14,
                fontWeight: 700,
                letterSpacing: 1,
                fontFamily: "monospace",
                px: isMobile ? 2.5 : 5,
                py: isMobile ? 1.2 : 1.5,
                borderRadius: 2,
                textTransform: "none",
                backdropFilter: "blur(4px)",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.4)",
                  bgcolor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              Leaderboard
            </Button>
            <Button
              onClick={goToMenu}
              variant="outlined"
              startIcon={<Home size={isMobile ? 14 : 16} />}
              sx={{
                color: "rgba(255,160,160,0.85)",
                borderColor: "rgba(255,100,100,0.3)",
                fontSize: isMobile ? 12 : 14,
                fontWeight: 700,
                fontFamily: "monospace",
                px: isMobile ? 2 : 4,
                py: isMobile ? 1.2 : 1.5,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  borderColor: "rgba(255,100,100,0.5)",
                  bgcolor: "rgba(255,50,50,0.06)",
                },
              }}
            >
              Menu
            </Button>
          </Box>
        </div>
      )}

      {/* ── Virtual controls — mobile: show only during active gameplay ── */}
      {isMobile && running && !gameOver && (
        <VirtualControls
          ultReady={ultReady}
          ultActive={ultActive}
          ultCharge={ultCharge}
          onUlt={() => {
            const w = window as unknown as Record<string, unknown>;
            const fn = w.__activateUlt as (() => void) | undefined;
            if (fn) fn();
          }}
          onDash={() => {
            const w = window as unknown as Record<string, unknown>;
            const k = w.__keys as Record<string, boolean> | undefined;
            if (k) {
              k["KeyQ"] = true;
              setTimeout(() => {
                k["KeyQ"] = false;
              }, 80);
            }
          }}
          onPause={() => {
            setRunning(!running);
            setWaveMessage(running ? "PAUSA" : "RETOMANDO...");
          }}
          running={running}
        />
      )}

    </>
  );
}
