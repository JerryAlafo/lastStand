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
} from "lucide-react";
import { signOut } from "next-auth/react";
import { MultiProps } from "@/lib/gameTypes";
import VirtualControls from "./VirtualControls";
import SettingsModal from "./SettingsModal";
import GameOverScreen from "./GameOverScreen";
import MainMenuOverlay from "./MainMenuOverlay";
import PvpResultModal from "./PvpResultModal";
import TopBar from "./TopBar";
import UltimateButton from "./UltimateButton";
import PauseModal from "./PauseModal";

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
      return { skin: "#c68642", shirt: "#4a90d9", shorts: "#1a2255", shoe: "#111111" };
    try {
      return {
        skin: "#c68642", shirt: "#4a90d9", shorts: "#1a2255", shoe: "#111111",
        ...JSON.parse(localStorage.getItem("lsa_player_settings") ?? "{}"),
      };
    } catch {
      return { skin: "#c68642", shirt: "#4a90d9", shorts: "#1a2255", shoe: "#111111" };
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
    if (!gameOver) { savedRef.current = false; return; }
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
      {/* ── HP flash vignette ── */}
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
        @keyframes hpVignetteFade { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes cdPulse {
          0%   { transform: scale(1.6); opacity: 0; }
          25%  { opacity: 1; }
          80%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
        @keyframes ultPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(255,220,0,0.4); }
          50% { box-shadow: 0 0 30px rgba(255,180,0,0.85); }
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

      {/* ── PVP Result modal ── */}
      {pvpResult && (
        <PvpResultModal
          pvpResult={pvpResult}
          pvpRematch={pvpRematch}
          multiProps={multiProps}
          setPvpResult={setPvpResult}
          setPvpRematch={setPvpRematch}
          reset={reset}
          router={router}
        />
      )}

      {/* ── Top bar ── */}
      <TopBar
        hp={hp}
        maxHp={maxHp}
        wave={wave}
        score={score}
        kills={kills}
        isMobile={isMobile}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        topBarBg={topBarBg}
        cardBorder={cardBorder}
      />

      {/* ── Pause / Logout buttons — desktop only, during active gameplay ── */}
      <Box
        sx={{
          position: "absolute", top: 10, right: 16,
          display: !isMobile && running ? "flex" : "none",
          gap: 1, zIndex: 20, flexWrap: "wrap", justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={() => setRunning(!running)}
          variant="contained"
          startIcon={running ? <Pause size={14} /> : <Play size={14} />}
          sx={{
            bgcolor: running ? "rgba(243,156,18,0.85)" : "rgba(46,204,113,0.85)",
            backdropFilter: "blur(6px)", color: "#fff", fontSize: 11, fontWeight: 700,
            fontFamily: "monospace", textTransform: "none", borderRadius: 2,
            "&:hover": { bgcolor: running ? "#e67e22" : "#27ae60" },
          }}
        >
          {running ? "Pausar" : "Resumir"}
        </Button>

        <Button
          onClick={() => { setShowSettings(true); setRunning(false); }}
          variant="contained"
          startIcon={<Settings size={14} />}
          sx={{
            bgcolor: "rgba(100,100,120,0.75)", backdropFilter: "blur(6px)", color: "#fff",
            fontSize: 11, fontWeight: 700, fontFamily: "monospace", textTransform: "none", borderRadius: 2,
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
              bgcolor: "rgba(231,76,60,0.88)", backdropFilter: "blur(6px)", color: "#fff",
              fontSize: 11, fontWeight: 700, fontFamily: "monospace", textTransform: "none", borderRadius: 2,
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
              bgcolor: "rgba(231,76,60,0.82)", backdropFilter: "blur(6px)", color: "#fff",
              fontSize: 11, fontWeight: 700, fontFamily: "monospace", textTransform: "none", borderRadius: 2,
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
            position: "absolute", top: 62, right: 16, width: 240,
            background: cardBg, border: `1px solid ${cardBorder}`,
            borderRadius: 14, padding: "12px 14px", fontFamily: "monospace",
            backdropFilter: "blur(10px)", transition: "background 1s ease, border-color 1s ease",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Avatar
              sx={{
                width: 38, height: 38,
                bgcolor: t > 0.5 ? "rgba(0,80,200,0.25)" : "rgba(0,229,255,0.18)",
                border: `1px solid ${t > 0.5 ? "rgba(0,100,255,0.4)" : "rgba(0,229,255,0.35)"}`,
                color: textPrimary, fontWeight: 800, fontSize: 14, transition: "all 1s",
              }}
            >
              {initials}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: textPrimary, lineHeight: 1.1, transition: "color 1s" }}>
                {username}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, transition: "color 1s" }}>
                desde{" "}
                {session.user.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString()
                  : "—"}
              </Typography>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: textSecondary, transition: "color 1s" }}>Melhor</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#7b2ff7" }}>{best ?? "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: textSecondary, transition: "color 1s" }}>Kills (sessão)</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#e74c3c" }}>{kills}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── XP bar ── */}
      <div style={{ position: "absolute", top: 50, left: 16, right: 16, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
        <div
          style={{
            height: "100%", borderRadius: 2,
            background: "linear-gradient(90deg, #7b2ff7, #00c3ff)",
            width: `${Math.min(100, (xp / xpNext) * 100).toFixed(0)}%`,
            transition: "width 0.2s",
            boxShadow: "0 0 6px #7b2ff788",
          }}
        />
      </div>

      {/* ── Active effects ── */}
      <div style={{ position: "absolute", top: 60, left: 16, display: "flex", gap: 5 }}>
        {Object.entries(activeEffects).map(([k, v]) =>
          effectIcons[k] && (v || 0) > 0 ? (
            <div
              key={k}
              style={{
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 4,
                border: "0.5px solid rgba(255,255,255,0.2)", fontFamily: "monospace",
                display: "flex", alignItems: "center", gap: 4,
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
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            color: "#f39c12", fontSize: 30, fontWeight: 700, fontFamily: "monospace",
            textShadow: "0 0 20px #f39c12", pointerEvents: "none", whiteSpace: "nowrap",
          }}
        >
          {waveMessage}
        </div>
      )}

      {/* ── Ultimate ability button (desktop only) ── */}
      <UltimateButton ultCharge={ultCharge} ultReady={ultReady} ultActive={ultActive} isMobile={isMobile} />

      {/* ── Settings modal ── */}
      <SettingsModal
        open={showSettings}
        onClose={() => { setShowSettings(false); setRunning(true); }}
        cfg={cfg}
        onSave={saveSettings}
        username={username}
      />

      {/* ── Controls hint ── */}
      <div
        style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 8, pointerEvents: "none",
        }}
      >
        {["WASD mover", "ataque auto", "Q dash", "E fúria"].map((h) => (
          <span
            key={h}
            style={{
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
              color: "rgba(255,255,255,0.5)", fontSize: 10, padding: "3px 9px",
              borderRadius: 4, border: "0.5px solid rgba(255,255,255,0.15)", fontFamily: "monospace",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* ── Pause modal ── */}
      {!running && !gameOver && hasEverStarted && (
        <PauseModal
          wave={wave}
          score={score}
          kills={kills}
          isMobile={isMobile}
          session={session}
          best={best}
          initials={initials}
          username={username}
          onResume={() => setRunning(true)}
          onSettings={() => setShowSettings(true)}
          goToMenu={goToMenu}
        />
      )}

      {/* ── Main menu / Start overlay ── */}
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
              setTimeout(() => { k["KeyQ"] = false; }, 80);
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
