"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const GameScene = dynamic(() => import("@/components/game/GameScene"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100vw", height: "100vh",
      background: "radial-gradient(ellipse at 50% 35%, #2a1050 0%, #0e0520 60%, #08021a 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
      fontFamily: "monospace",
    }}>
      {/* Glow blobs */}
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
        a carregar arena...
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
  ),
});

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFade(true), 2000);
    const doneTimer = setTimeout(() => onDone(), 2700);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "radial-gradient(ellipse at 50% 35%, #2a1050 0%, #0e0520 60%, #08021a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 0,
      opacity: fade ? 0 : 1, transition: "opacity 0.7s ease",
    }}>
      {/* Glow blobs */}
      <div style={{ position: "absolute", top: "8%", left: "8%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div style={{
          fontSize: 11, letterSpacing: 6, color: "rgba(200,150,255,0.5)",
          textTransform: "uppercase", fontFamily: "monospace", marginBottom: 20,
        }}>apresenta</div>

        <div style={{
          fontSize: "clamp(26px, 7vw, 44px)", fontWeight: 900, letterSpacing: "clamp(2px, 1vw, 5px)",
          fontFamily: "'Segoe UI', 'Inter', sans-serif",
          background: "linear-gradient(135deg, #fff, #aa55ff)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textAlign: "center", padding: "0 20px", lineHeight: 1.1,
        }}>Last Stand Arena</div>

        <div style={{
          width: "60%", height: 1, marginTop: 20, marginBottom: 24,
          background: "linear-gradient(90deg, transparent, rgba(123,47,247,0.4), transparent)",
        }} />

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 3, fontFamily: "monospace", marginBottom: 10 }}>
          criado por
        </div>

        <div style={{
          fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 700,
          background: "linear-gradient(135deg, #fff, #aa55ff)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: 1,
        }}>Jerry Alafo</div>

        <div style={{ marginTop: 48, display: "flex", gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "rgba(123,47,247,0.5)",
              animation: `splashPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes splashPulse {
          0%,100% { opacity: 0.2; transform: scale(0.7); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function GamePageInner() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [showSplash, setShowSplash] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  const roomId = params.get("room") ?? undefined;
  const role   = (params.get("role") ?? undefined) as "host" | "guest" | undefined;
  const mode   = (params.get("mode") ?? undefined) as "pvp" | "coop" | undefined;
  const eventMode = params.get("event") === "1";

  const multiProps = roomId && role && mode ? { roomId, role, mode } : undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    const handler = () => setGameKey(k => k + 1);
    window.addEventListener("gameRestart", handler);
    return () => window.removeEventListener("gameRestart", handler);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0008" }}>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <GameScene key={gameKey} multiProps={multiProps} eventMode={eventMode} />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense>
      <GamePageInner />
    </Suspense>
  );
}
