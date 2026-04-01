"use client";

import { Box, Button } from "@mui/material";
import { RotateCcw, Trophy, Home, Skull } from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function GameOverScreen({
  score,
  wave,
  kills,
  best,
  isMobile,
  onPlayAgain,
  onMenu,
  router,
}: {
  score: number;
  wave: number;
  kills: number;
  best: number | null;
  isMobile: boolean;
  onPlayAgain: () => void;
  onMenu: () => void;
  router: AppRouterInstance;
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
          onClick={onPlayAgain}
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
          onClick={onMenu}
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
  );
}
