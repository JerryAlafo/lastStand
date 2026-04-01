"use client";

import { Button } from "@mui/material";
import {
  Zap,
  Swords,
  Users,
  BarChart2,
  Trophy,
  Heart,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { MultiProps } from "@/lib/gameTypes";

export default function MainMenuOverlay({
  session,
  isMobile,
  kills,
  best,
  score,
  onStart,
  onSettings,
  router,
}: {
  session: Session | null;
  isMobile: boolean;
  dayTime?: number;
  kills: number;
  best: number | null;
  score: number;
  onStart: () => void;
  onSettings: () => void;
  onSignOut?: () => void;
  router: AppRouterInstance;
  multiProps?: MultiProps;
}) {
  return (
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
        onClick={onStart}
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
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginTop: 20,
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 380,
        }}
      >
        {/* Multiplayer — destaque com glow */}
        <button
          onClick={() => router.push("/multiplayer")}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(123,47,247,0.5)",
            background: "rgba(123,47,247,0.15)",
            color: "rgba(200,150,255,0.9)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "inherit",
            fontWeight: 700,
            backdropFilter: "blur(8px)",
            transition: "all 0.15s",
            boxShadow: "0 0 12px rgba(123,47,247,0.2)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(123,47,247,0.28)";
            (e.currentTarget as HTMLButtonElement).style.color = "#dd99ff";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(123,47,247,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(123,47,247,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(200,150,255,0.9)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(123,47,247,0.2)";
          }}
        >
          <Users size={13} /> Multiplayer
        </button>

        <button
          onClick={() => router.push("/stats")}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "inherit",
            backdropFilter: "blur(8px)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
          }}
        >
          <BarChart2 size={13} /> Estatísticas
        </button>
        <button
          onClick={() => router.push("/leaderboard")}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,215,0,0.2)",
            background: "rgba(255,215,0,0.05)",
            color: "rgba(255,215,0,0.7)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "inherit",
            backdropFilter: "blur(8px)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,215,0,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ffd700";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,215,0,0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,215,0,0.7)";
          }}
        >
          <Trophy size={13} /> Leaderboard
        </button>
        <button
          onClick={() => router.push("/donate")}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,100,150,0.25)",
            background: "rgba(255,80,120,0.06)",
            color: "rgba(255,150,180,0.75)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "inherit",
            backdropFilter: "blur(8px)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,120,0.14)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ff99bb";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,120,0.06)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,150,180,0.75)";
          }}
        >
          <Heart size={13} /> Apoiar
        </button>
        <button
          onClick={onSettings}
          style={{
            padding: "10px 12px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
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
            padding: "10px 12px", borderRadius: 8,
            border: "1px solid rgba(231,76,60,0.2)",
            background: "rgba(231,76,60,0.05)",
            color: "rgba(255,120,120,0.6)", fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "inherit", backdropFilter: "blur(8px)", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(231,76,60,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#ff8888"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(231,76,60,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,120,120,0.6)"; }}
        >
          <LogOut size={13} /> Sair
        </button>
      </div>

    </div>
  );
}
