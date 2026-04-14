"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowLeft, Trophy, Flame, Swords, TrendingUp } from "lucide-react";

type RecordItem = { value: number; username: string; date: string };

export default function RecordsPage() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:640px)");
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
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: isMobile ? "18px 12px 24px" : "28px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ position: "fixed", top: "5%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
      <Box sx={{ maxWidth: 700, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.2, flexWrap: "wrap" }}>
          <Button onClick={() => router.push("/game")} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Trophy size={24} color="#ffd700" style={{ filter: "drop-shadow(0 0 8px #ffd70066)" }} />
            <Typography sx={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Mural de Recordes
            </Typography>
          </Box>
        </Box>

        <Box sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, backdropFilter: "blur(12px)", boxShadow: "0 0 60px rgba(123,47,247,0.1), 0 8px 32px rgba(0,0,0,0.4)", overflow: "hidden" }}>
          {!isMobile && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1.5fr 0.7fr 1fr 0.7fr", px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            {["Recorde", "Valor", "Jogador", "Data"].map(h => (
              <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "rgba(200,150,255,0.75)", textTransform: "uppercase" }}>{h}</Typography>
            ))}
          </Box>
          )}

          <Box sx={{ display: "grid", gap: 0 }}>
          {cards.map((c) => {
            const rec = records?.[c.key] as RecordItem | null | undefined;
            return (
              <Box key={c.key} sx={{ px: isMobile ? 1.4 : 2.5, py: isMobile ? 1.2 : 1.6, borderBottom: "1px solid rgba(255,255,255,0.04)", "&:last-child": { borderBottom: "none" }, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 0.7fr 1fr 0.7fr", alignItems: "center", gap: isMobile ? 0.7 : 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {c.icon}
                  <Typography sx={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{c.label}</Typography>
                </Box>
                {rec ? (
                  <>
                    <Typography sx={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#ffd700" }}>{rec.value.toLocaleString()}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)" }}>
                        {rec.username.slice(0, 2).toUpperCase()}
                      </Box>
                      <Typography sx={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#aa55ff" }}>{rec.username}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{new Date(rec.date).toLocaleDateString("pt-PT")}</Typography>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>—</Typography>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Sem dados</Typography>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>—</Typography>
                  </>
                )}
              </Box>
            );
          })}
          </Box>
        </Box>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}>
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            Recordes históricos · Last Stand Arena
          </Typography>
        </Box>
      </Box>
    </div>
  );
}
