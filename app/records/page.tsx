"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ArrowLeft, Trophy, Flame, Swords, TrendingUp } from "lucide-react";

type RecordItem = { value: number; username: string; date: string };

export default function RecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<{
    maxWave: RecordItem | null;
    maxKills: RecordItem | null;
    maxScore: RecordItem | null;
    maxStreak: RecordItem | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/records")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRecords(d))
      .catch(() => setRecords(null));
  }, []);

  const cards = [
    { key: "maxWave", label: "Maior Wave da História", icon: <Trophy size={18} color="#ffd700" /> },
    { key: "maxKills", label: "Mais Kills numa Partida", icon: <Swords size={18} color="#e74c3c" /> },
    { key: "maxScore", label: "Maior Score", icon: <TrendingUp size={18} color="#7b2ff7" /> },
    { key: "maxStreak", label: "Maior Streak Diário", icon: <Flame size={18} color="#ff8c00" /> },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: "28px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <Box sx={{ maxWidth: 700, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button onClick={() => router.push("/game")} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Trophy size={24} color="#ffd700" style={{ filter: "drop-shadow(0 0 8px #ffd70066)" }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Mural de Recordes
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 1.5 }}>
          {cards.map((c) => {
            const rec = records?.[c.key] as RecordItem | null | undefined;
            return (
              <Box key={c.key} sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  {c.icon}
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{c.label}</Typography>
                </Box>
                {rec ? (
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.95)" }}>{rec.value.toLocaleString()}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#aa55ff" }}>{rec.username}</Typography>
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{new Date(rec.date).toLocaleDateString("pt-PT")}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Sem dados ainda.</Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </div>
  );
}
