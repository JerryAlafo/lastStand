"use client";

import { MultiProps } from "@/lib/gameTypes";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Trophy, Skull, DoorOpen } from "lucide-react";

interface Props {
  pvpResult: "win" | "loss" | "abandoned";
  pvpRematch: { host: boolean; guest: boolean } | null;
  multiProps?: MultiProps;
  setPvpResult: (v: null) => void;
  setPvpRematch: (v: null | ((prev: { host: boolean; guest: boolean } | null) => { host: boolean; guest: boolean })) => void;
  reset: () => void;
  router: AppRouterInstance;
}

export default function PvpResultModal({
  pvpResult,
  pvpRematch,
  multiProps,
  setPvpResult,
  setPvpRematch,
  reset,
  router,
}: Props) {
  return (
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: pvpResult === "win" ? "#ffd700" : pvpResult === "abandoned" ? "rgba(255,255,255,0.5)" : "#e74c3c" }}>
          {pvpResult === "win"
            ? <Trophy size={64} style={{ filter: "drop-shadow(0 0 20px #ffd70066)" }} />
            : pvpResult === "abandoned"
            ? <DoorOpen size={64} />
            : <Skull size={64} style={{ filter: "drop-shadow(0 0 20px #e74c3c66)" }} />}
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

        {/* Rematch voting */}
        {multiProps && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, letterSpacing: 1 }}>
              NOVA PARTIDA
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 10 }}>
              <div style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: pvpRematch?.host ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${pvpRematch?.host ? "rgba(46,204,113,0.5)" : "rgba(255,255,255,0.12)"}`,
                color: pvpRematch?.host ? "#2ecc71" : "rgba(255,255,255,0.4)",
                transition: "all 0.3s",
              }}>
                {pvpRematch?.host ? "✓ Anfitrião" : "… Anfitrião"}
              </div>
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
  );
}
