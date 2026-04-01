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
  Settings,
  Home,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { MultiProps } from "@/lib/gameTypes";
import VirtualControls from "./VirtualControls";
import SettingsModal from "./SettingsModal";
import GameOverScreen from "./GameOverScreen";
import MainMenuOverlay from "./MainMenuOverlay";

// Lerp between two RGBA arrays based on t (0=night, 1=day)
function lerpRgba(night: number[], day: number[], t: number): string {
  const r = Math.round(night[0] + (day[0] - night[0]) * t);
  const g = Math.round(night[1] + (day[1] - night[1]) * t);
  const b = Math.round(night[2] + (day[2] - night[2]) * t);
  const a = +(night[3] + (day[3] - night[3]) * t).toFixed(2);
  return `rgba(${r},${g},${b},${a})`;
}

export default function HUD({ multiProps }: { multiProps?: MultiProps }) {
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
    if (multiProps) {
      // In multiplayer, "menu" exits the room; GameScene unmount closes it via the close API
      router.push("/multiplayer");
      return;
    }
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
  // PVP pre-game countdown (3, 2, 1) exposed from GameScene via window.__pvpCountdown
  const [pvpCountdown, setPvpCountdown] = useState<number | null>(null);
  // PVP end-of-match result: "win" | "loss" | "abandoned" | null
  const [pvpResult, setPvpResult] = useState<"win" | "loss" | "abandoned" | null>(null);
  // Rematch vote state: which players clicked "Nova partida"
  const [pvpRematch, setPvpRematch] = useState<{ host: boolean; guest: boolean } | null>(null);
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
        const cd = w.__pvpCountdown as number | undefined;
        setPvpCountdown(cd !== undefined ? cd : null);
        const res = w.__pvpResult as "win" | "loss" | "abandoned" | undefined;
        if (res) setPvpResult(res);
        const rm = w.__pvpRematch as { host: boolean; guest: boolean } | undefined;
        if (rm) {
          setPvpRematch({ ...rm });
          // Both voted → host triggers full reset via sync
          if (rm.host && rm.guest && multiProps?.role === "host") {
            (w as Record<string, unknown>).__pvpTriggerReset = true;
          }
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
        @keyframes cdPulse {
          0%   { transform: scale(1.6); opacity: 0; }
          25%  { opacity: 1; }
          80%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
      `}</style>

      {/* ── PVP Countdown overlay ── */}
      {pvpCountdown !== null && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50, pointerEvents: "none",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 100%)",
        }}>
          <div
            key={pvpCountdown}
            style={{
              fontSize: "clamp(90px, 22vw, 160px)", fontWeight: 900, color: "#fff",
              fontFamily: "monospace", lineHeight: 1,
              textShadow: "0 0 40px rgba(123,47,247,0.9), 0 0 100px rgba(123,47,247,0.5)",
              animation: "cdPulse 0.95s ease-out forwards",
            }}
          >
            {pvpCountdown}
          </div>
          <div style={{
            fontSize: "clamp(12px, 3vw, 18px)", letterSpacing: 4, color: "rgba(200,150,255,0.7)",
            textTransform: "uppercase", fontFamily: "monospace", marginTop: 16,
          }}>
            PVP — Preparar…
          </div>
        </div>
      )}

      {/* ── PVP Result modal (win / loss / abandoned) with rematch voting ── */}
      {pvpResult && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #1a0a30, #0e0520)",
            border: `1px solid ${pvpResult === "win" ? "rgba(46,204,113,0.4)" : "rgba(255,170,0,0.35)"}`,
            borderRadius: 20, padding: "40px 36px", textAlign: "center",
            maxWidth: 380, width: "90%",
            boxShadow: pvpResult === "win"
              ? "0 0 60px rgba(46,204,113,0.25)"
              : "0 0 60px rgba(255,170,0,0.2)",
          }}>
            <div style={{ fontSize: "clamp(48px, 12vw, 72px)", lineHeight: 1, marginBottom: 12 }}>
              {pvpResult === "win" ? "🏆" : pvpResult === "abandoned" ? "🚪" : "💀"}
            </div>
            <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "#fff", marginBottom: 8 }}>
              {pvpResult === "win" ? "Vitória!" : pvpResult === "abandoned" ? "Adversário saiu" : "Derrota"}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24, lineHeight: 1.5 }}>
              {pvpResult === "win"
                ? "Eliminaste o adversário. Parabéns!"
                : pvpResult === "abandoned"
                ? "O adversário abandonou a partida."
                : "Foste eliminado pelo adversário."}
            </div>

            {/* Rematch voting — only shown when in a live room */}
            {multiProps && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, letterSpacing: 1 }}>
                  NOVA PARTIDA
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 10 }}>
                  {/* Host vote pill */}
                  <div style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: pvpRematch?.host ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${pvpRematch?.host ? "rgba(46,204,113,0.5)" : "rgba(255,255,255,0.12)"}`,
                    color: pvpRematch?.host ? "#2ecc71" : "rgba(255,255,255,0.4)",
                    transition: "all 0.3s",
                  }}>
                    {pvpRematch?.host ? "✓ Anfitrião" : "… Anfitrião"}
                  </div>
                  {/* Guest vote pill */}
                  <div style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: pvpRematch?.guest ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${pvpRematch?.guest ? "rgba(46,204,113,0.5)" : "rgba(255,255,255,0.12)"}`,
                    color: pvpRematch?.guest ? "#2ecc71" : "rgba(255,255,255,0.4)",
                    transition: "all 0.3s",
                  }}>
                    {pvpRematch?.guest ? "✓ Convidado" : "… Convidado"}
                  </div>
                </div>
                {/* My vote button */}
                {(() => {
                  const myVote = multiProps.role === "host" ? pvpRematch?.host : pvpRematch?.guest;
                  return myVote ? (
                    <div style={{ fontSize: 12, color: "rgba(46,204,113,0.7)" }}>
                      A aguardar o adversário…
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const w = window as unknown as Record<string, unknown>;
                        w.__pvpRematchVote = true;
                        setPvpRematch(prev => {
                          const next = prev ?? { host: false, guest: false };
                          return multiProps.role === "host"
                            ? { ...next, host: true }
                            : { ...next, guest: true };
                        });
                      }}
                      style={{
                        padding: "10px 28px", borderRadius: 10, border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg,#2ecc71,#27ae60)",
                        color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                        boxShadow: "0 0 20px rgba(46,204,113,0.3)",
                      }}
                    >
                      Jogar de novo
                    </button>
                  );
                })()}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => { setPvpResult(null); setPvpRematch(null); router.push("/multiplayer"); }}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#7b2ff7,#aa55ff)",
                  color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                }}
              >
                Novo Lobby
              </button>
              <button
                onClick={() => { setPvpResult(null); setPvpRematch(null); reset(); }}
                style={{
                  padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                }}
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

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

        {multiProps && (
          <Button
            onClick={() => router.push("/multiplayer")}
            variant="contained"
            startIcon={<LogOut size={14} />}
            sx={{
              bgcolor: "rgba(231,76,60,0.88)",
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
            Abandonar
          </Button>
        )}

        {!multiProps && session?.user?.username && (
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
            window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
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
      <SettingsModal
        open={showSettings}
        onClose={() => { setShowSettings(false); setRunning(true); }}
        cfg={cfg}
        onSave={saveSettings}
        username={username}
      />


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
        <MainMenuOverlay
          session={session}
          isMobile={isMobile}
          dayTime={dayTime}
          kills={kills}
          best={best}
          score={score}
          onStart={() => reset()}
          onSettings={() => setShowSettings(true)}
          router={router}
          multiProps={multiProps}
        />
      )}

      {/* ── Game Over (solo / co-op; suppressed in PVP when pvpResult modal handles it) ── */}
      {gameOver && !pvpResult && (
        <GameOverScreen
          score={score}
          wave={wave}
          kills={kills}
          best={best}
          isMobile={isMobile}
          onPlayAgain={() => reset()}
          onMenu={goToMenu}
          router={router}
        />
      )}

      {/* ── Abandonar button — mobile multiplayer ── */}
      {isMobile && running && !gameOver && multiProps && (
        <button
          onTouchStart={(e) => { e.preventDefault(); router.push("/multiplayer"); }}
          style={{
            position: "absolute", top: 14, left: 14, zIndex: 20,
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(231,76,60,0.82)", border: "1px solid rgba(255,80,80,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", backdropFilter: "blur(6px)",
          }}
        >
          <LogOut size={18} color="#fff" />
        </button>
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
