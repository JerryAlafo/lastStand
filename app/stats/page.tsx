"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ArrowLeft, Users, Gamepad2, Trophy, Crown, Swords, Zap, Star } from "lucide-react";

interface PlayerStat {
  username: string;
  bestScore: number;
  totalKills: number;
  gamesPlayed: number;
}

interface StatsData {
  totalUsers: number;
  totalGames: number;
  topPlayers: PlayerStat[];
  champion: PlayerStat | null;
}

const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32", "#9b59b6", "#3498db"];
const BAR_GRADIENT = [
  "linear-gradient(90deg,#ffd700,#ff8800)",
  "linear-gradient(90deg,#c0c0c0,#e0e0e0)",
  "linear-gradient(90deg,#cd7f32,#e89050)",
  "linear-gradient(90deg,#7b2ff7,#aa55ff)",
  "linear-gradient(90deg,#0088ff,#00ccff)",
];

function StatCard({ icon, label, value, color, glow }: { icon: React.ReactNode; label: string; value: string | number; color: string; glow: string }) {
  return (
    <Box sx={{
      flex: 1, minWidth: 140,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 3, p: "20px 22px",
      backdropFilter: "blur(12px)",
      boxShadow: `0 0 30px ${glow}`,
      textAlign: "center",
    }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5, color }}>{icon}</Box>
      <Typography sx={{ fontSize: 32, fontWeight: 900, color, mb: 0.5, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace" }}>{label}</Typography>
    </Box>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: StatsData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const maxScore = data?.topPlayers[0]?.bestScore || 1;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 20%, #2a1050 0%, #160830 55%, #0e0520 100%)",
      color: "#fff", padding: "28px 20px",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* Glow blobs */}
      <div style={{ position: "fixed", top: "5%", left: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "8%", right: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,195,255,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ maxWidth: 860, mx: "auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Button
            onClick={() => router.back()}
            startIcon={<ArrowLeft size={16} />}
            variant="outlined"
            sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "rgba(255,255,255,0.35)", bgcolor: "rgba(255,255,255,0.04)" } }}
          >
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Star size={24} color="#ffd700" style={{ filter: "drop-shadow(0 0 8px #ffd70066)" }} />
            <Typography sx={{ fontSize: 24, fontWeight: 800, background: "linear-gradient(135deg,#fff,#cc88ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 0.5 }}>
              Estatísticas
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 10, color: "rgba(255,255,255,0.3)", fontSize: 15 }}>A carregar...</Box>
        ) : !data ? (
          <Box sx={{ textAlign: "center", py: 10, color: "rgba(255,100,100,0.7)", fontSize: 15 }}>Erro ao carregar dados.</Box>
        ) : (
          <>
            {/* Summary cards */}
            <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
              <StatCard icon={<Users size={28} />} label="Utilizadores" value={data.totalUsers} color="#aa66ff" glow="rgba(123,47,247,0.2)" />
              <StatCard icon={<Gamepad2 size={28} />} label="Partidas jogadas" value={data.totalGames} color="#00c3ff" glow="rgba(0,195,255,0.15)" />
              <StatCard icon={<Trophy size={28} />} label="Melhor score" value={data.champion?.bestScore?.toLocaleString() ?? "—"} color="#ffd700" glow="rgba(255,215,0,0.2)" />
            </Box>

            {/* Champion card */}
            {data.champion && (
              <Box sx={{ mb: 4, p: "22px 26px", background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 4, backdropFilter: "blur(12px)", boxShadow: "0 0 40px rgba(255,215,0,0.1)", display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#ffd700,#ff8800)", boxShadow: "0 0 24px rgba(255,215,0,0.5)", flexShrink: 0 }}>
                  <Crown size={28} color="#fff" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography sx={{ fontSize: 11, letterSpacing: 2.5, color: "rgba(255,215,0,0.7)", textTransform: "uppercase", fontFamily: "monospace", mb: 0.5 }}>Campeão da Plataforma</Typography>
                  <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#ffd700", mb: 0.3 }}>{data.champion.username}</Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{data.champion.gamesPlayed} partidas jogadas</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.3 }}><Zap size={14} color="#ffd700" /><Typography sx={{ fontSize: 20, fontWeight: 900, color: "#ffd700" }}>{data.champion.bestScore.toLocaleString()}</Typography></Box>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>Melhor score</Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.3 }}><Swords size={14} color="#e74c3c" /><Typography sx={{ fontSize: 20, fontWeight: 900, color: "#e74c3c" }}>{data.champion.totalKills.toLocaleString()}</Typography></Box>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>Total kills</Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Bar chart — top players */}
            <Box sx={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, p: "24px 26px", backdropFilter: "blur(12px)", boxShadow: "0 0 40px rgba(123,47,247,0.08)" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#fff", mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
                <Trophy size={16} color="#ffd700" /> Ranking dos Melhores Jogadores
              </Typography>

              {data.topPlayers.length === 0 ? (
                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", py: 3 }}>Ainda não há scores registados.</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
                  {data.topPlayers.map((p, i) => {
                    const pct = Math.max(6, (p.bestScore / maxScore) * 100);
                    const color = RANK_COLORS[i] ?? "#7b2ff7";
                    const grad = BAR_GRADIENT[i] ?? "linear-gradient(90deg,#7b2ff7,#aa55ff)";
                    return (
                      <Box key={p.username} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {/* Rank */}
                        <Typography sx={{ width: 24, fontSize: 13, fontWeight: 800, color, textAlign: "right", flexShrink: 0 }}>
                          {i + 1}
                        </Typography>
                        {/* Name */}
                        <Typography sx={{ width: 120, fontSize: 14, fontWeight: 600, color: "#fff", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.username}
                        </Typography>
                        {/* Bar */}
                        <Box sx={{ flex: 1, height: 20, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden", position: "relative" }}>
                          <Box sx={{
                            height: "100%", width: `${pct}%`, borderRadius: 10,
                            background: grad,
                            boxShadow: `0 0 10px ${color}66`,
                            transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                          }} />
                        </Box>
                        {/* Score */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, width: 90, justifyContent: "flex-end", flexShrink: 0 }}>
                          <Zap size={12} color={color} />
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color }}>{p.bestScore.toLocaleString()}</Typography>
                        </Box>
                        {/* Kills */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, width: 70, justifyContent: "flex-end", flexShrink: 0 }}>
                          <Swords size={11} color="#e74c3c" />
                          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{p.totalKills}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Legend */}
              <Box sx={{ display: "flex", gap: 3, mt: 3, pt: 2, borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
                {[
                  { icon: <Zap size={13} color="#ffd700" />, label: "Melhor score" },
                  { icon: <Swords size={13} color="#e74c3c" />, label: "Total de kills" },
                ].map((l) => (
                  <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    {l.icon}
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{l.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Typography sx={{ mt: 3, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.18)" }}>
              Dados em tempo real · Last Stand Arena
            </Typography>
          </>
        )}
      </Box>
    </div>
  );
}
