"use client";

import { useEffect, useState } from "react";

interface Mission {
  id: string;
  desc: string;
  target: number;
  xpReward: number;
  progress: number;
  completed: boolean;
}

export default function DailyMissionsPanel() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/missions")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.missions) setMissions(d.missions); })
      .catch(() => undefined);
  }, []);

  const completed = missions.filter(m => m.completed).length;

  return (
    <div style={{ position: "absolute", bottom: 100, right: 16, zIndex: 15, fontFamily: "monospace" }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(20,10,40,0.85)", border: "1px solid rgba(123,47,247,0.35)",
          borderRadius: 10, padding: "7px 14px", cursor: "pointer",
          color: "#fff", fontSize: 12, fontFamily: "inherit",
          backdropFilter: "blur(8px)",
        }}
      >
        <span>📅</span>
        <span>Missões</span>
        <span style={{
          background: completed === 3 ? "rgba(46,204,113,0.4)" : "rgba(123,47,247,0.35)",
          border: `1px solid ${completed === 3 ? "rgba(46,204,113,0.6)" : "rgba(123,47,247,0.5)"}`,
          borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700,
          color: completed === 3 ? "#2ecc71" : "#aa77ff",
        }}>
          {completed}/3
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", right: 0,
          width: 280, background: "rgba(12,5,28,0.95)", border: "1px solid rgba(123,47,247,0.3)",
          borderRadius: 14, padding: "16px 14px", backdropFilter: "blur(12px)",
          boxShadow: "0 0 40px rgba(123,47,247,0.15)",
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(200,150,255,0.7)", marginBottom: 12, textTransform: "uppercase" }}>
            Missões Diárias
          </div>
          {missions.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>A carregar…</div>
          ) : missions.map(m => (
            <div key={m.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: m.completed ? "#2ecc71" : "rgba(255,255,255,0.8)" }}>
                  {m.completed ? "✓ " : ""}{m.desc}
                </span>
                <span style={{ fontSize: 11, color: "#aa77ff", fontWeight: 700 }}>+{m.xpReward}xp</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${Math.min(100, (m.progress / m.target) * 100)}%`,
                  background: m.completed ? "linear-gradient(90deg,#2ecc71,#27ae60)" : "linear-gradient(90deg,#7b2ff7,#aa55ff)",
                  transition: "width 0.4s",
                }} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                {m.progress}/{m.target}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
            Renova à meia-noite
          </div>
        </div>
      )}
    </div>
  );
}
