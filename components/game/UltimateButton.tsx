"use client";

import { Button } from "@mui/material";
import { Zap } from "lucide-react";

interface Props {
  ultCharge: number;
  ultReady: boolean;
  ultActive: boolean;
  isMobile: boolean;
}

export default function UltimateButton({ ultCharge, ultReady, ultActive, isMobile }: Props) {
  if (isMobile) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        pointerEvents: "auto",
      }}
    >
      {/* Charge bar */}
      <div style={{ width: 180, height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
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
          const w = window as unknown as Record<string, unknown>;
          const fn = w.__activateUlt as (() => void) | undefined;
          if (fn) fn();
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
          boxShadow: ultReady && !ultActive ? "0 0 22px rgba(255,220,0,0.55)" : "none",
          animation: ultReady && !ultActive ? "ultPulse 1s ease-in-out infinite" : "none",
          "&:hover": {
            background: ultReady ? "linear-gradient(135deg,#ffe033,#ff7700)" : undefined,
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
  );
}
