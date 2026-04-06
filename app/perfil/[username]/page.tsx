"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  ArrowLeft,
  User,
  Star,
  Target,
  Trophy,
  Sword,
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  Flame,
  Droplets,
  Crosshair,
  ShieldCheck,
  Award,
  Sparkles,
  Gem,
  Crown,
  Medal,
  Skull,
  Bomb,
  BadgeCheck,
  TrendingUp,
  Calendar,
  Gamepad2,
} from "lucide-react";

interface ProfileData {
  username: string;
  level: number;
  totalXp: number;
  title: string;
  color: string;
  selectedClass: string | null;
  bestScore: number;
  bestWave: number;
  totalKills: number;
  gamesPlayed: number;
  pvpWins: number;
  weeklyBest: number;
  achievements: string[];
  scoreHistory: Array<{
    score: number;
    wave: number;
    kills: number;
    date: string;
  }>;
}

const ALL_ACHIEVEMENTS = [
  { id: "first_blood", name: "Primeiro Sangue", desc: "Primeira kill" },
  { id: "kills_10", name: "10 Kills", desc: "10 eliminações" },
  { id: "kills_100", name: "100 Kills", desc: "100 eliminações" },
  { id: "kills_500", name: "500 Kills", desc: "500 eliminações" },
  { id: "kills_1000", name: "1000 Kills", desc: "1000 eliminações" },
  { id: "kills_5000", name: "5000 Kills", desc: "5000 eliminações" },
  { id: "wave_5", name: "Wave 5", desc: "Sobrevive à wave 5" },
  { id: "wave_10", name: "Wave 10", desc: "Sobrevive à wave 10" },
  { id: "wave_20", name: "Wave 20", desc: "Sobrevive à wave 20" },
  { id: "score_1k", name: "1K Score", desc: "Score de 1000" },
  { id: "score_10k", name: "10K Score", desc: "Score de 10000" },
  { id: "score_50k", name: "50K Score", desc: "Score de 50000" },
  { id: "pvp_win", name: "Vitória PVP", desc: "Ganha 1 PVP" },
  { id: "pvp_5", name: "5 PVP", desc: "Ganha 5 PVPs" },
  { id: "level_10", name: "Nível 10", desc: "Atinge nível 10" },
  { id: "level_20", name: "Nível 20", desc: "Atinge nível 20" },
  { id: "level_30", name: "Nível 30", desc: "Atinge nível 30" },
  { id: "session_100k", name: "100K Sessão", desc: "100K num jogo" },
  { id: "session_w15", name: "Wave 15 Sessão", desc: "Wave 15 num jogo" },
  { id: "blast_5", name: "5 Blasts", desc: "5 blasts usados" },
];

const CLASS_INFO: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  warrior: { label: "Guerreiro", icon: <Shield size={16} />, color: "#00cc66" },
  assassin: { label: "Assassino", icon: <Sword size={16} />, color: "#0099ff" },
  mage: { label: "Mago", icon: <Flame size={16} />, color: "#aa00ff" },
};

const ACH_ICONS: Record<string, React.ReactNode> = {
  first_blood: <Droplets size={18} />,
  kills_10: <Crosshair size={18} />,
  kills_100: <Target size={18} />,
  kills_500: <Sword size={18} />,
  kills_1000: <Skull size={18} />,
  kills_5000: <Skull size={18} />,
  wave_5: <Shield size={18} />,
  wave_10: <ShieldCheck size={18} />,
  wave_20: <Award size={18} />,
  score_1k: <Star size={18} />,
  score_10k: <Sparkles size={18} />,
  score_50k: <Gem size={18} />,
  pvp_win: <Zap size={18} />,
  pvp_5: <Sword size={18} />,
  level_10: <Medal size={18} />,
  level_20: <BadgeCheck size={18} />,
  level_30: <Crown size={18} />,
  session_100k: <Flame size={18} />,
  session_w15: <Trophy size={18} />,
  blast_5: <Bomb size={18} />,
};

function MiniChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 280,
    h = 60,
    pad = 4;
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient
          id={`grad-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
        fill={`url(#grad-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.length <= 30 &&
        data.map((v, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = h - pad - (v / max) * (h - pad * 2);
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
        })}
    </svg>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:640px)");
  const username = params?.username as string | undefined;

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetch(`/api/profile/${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
          A carregar...
        </Typography>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <Typography
          sx={{ color: "rgba(255,100,100,0.7)", fontSize: 16, mb: 2 }}
        >
          Jogador não encontrado.
        </Typography>
        <Button
          onClick={() => router.back()}
          startIcon={<ArrowLeft size={16} />}
          variant="outlined"
          sx={{
            color: "rgba(255,255,255,0.6)",
            borderColor: "rgba(255,255,255,0.15)",
            borderRadius: 2,
            textTransform: "none",
          }}
        >
          Voltar
        </Button>
      </div>
    );
  }

  const achCount = data.achievements.length;
  const achSet = new Set(data.achievements);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)",
        color: "#fff",
        padding: "28px 20px",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "5%",
          left: "10%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(123,47,247,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ maxWidth: 800, mx: "auto", position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button
            onClick={() => router.back()}
            startIcon={<ArrowLeft size={16} />}
            variant="outlined"
            sx={{
              color: "rgba(255,255,255,0.7)",
              borderColor: "rgba(255,255,255,0.15)",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.35)",
                bgcolor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <User
              size={24}
              color={data.color}
              style={{ filter: `drop-shadow(0 0 8px ${data.color}66)` }}
            />
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 800,
                background: `linear-gradient(135deg, #fff, ${data.color})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {/* {data.username} */}
              PERFIL
            </Typography>
          </Box>
        </Box>

        {/* Level + Class Card */}
        <Box
          sx={{
            mb: 3,
            p: "20px 24px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${data.color}44`,
            borderRadius: 3,
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${data.color}22`,
              border: `2px solid ${data.color}66`,
            }}
          >
            <Typography
              sx={{ fontSize: 22, fontWeight: 900, color: data.color }}
            >
              {data.level}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
                {data.username}
              </Typography>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: `${data.color}22`,
                  border: `1px solid ${data.color}55`,
                  color: data.color,
                  fontWeight: 700,
                }}
              >
                {data.title}
              </span>
            </Box>
            <Typography
              sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mt: 0.3 }}
            >
              <Star
                size={11}
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  marginRight: 2,
                }}
              />
              {data.totalXp.toLocaleString()} XP
            </Typography>
          </Box>
          {data.selectedClass && CLASS_INFO[data.selectedClass] && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: "8px 14px",
                borderRadius: 2,
                background: `${CLASS_INFO[data.selectedClass].color}15`,
                border: `1px solid ${CLASS_INFO[data.selectedClass].color}40`,
              }}
            >
              {CLASS_INFO[data.selectedClass].icon}
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: CLASS_INFO[data.selectedClass].color,
                }}
              >
                {CLASS_INFO[data.selectedClass].label}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {[
            {
              icon: <Trophy size={20} />,
              label: "Melhor Score",
              value: data.bestScore.toLocaleString(),
              color: "#ffd700",
            },
            {
              icon: <Gamepad2 size={20} />,
              label: "Melhor Wave",
              value: data.bestWave.toString(),
              color: "#f39c12",
            },
            {
              icon: <Sword size={20} />,
              label: "Total Kills",
              value: data.totalKills.toLocaleString(),
              color: "#e74c3c",
            },
            {
              icon: <Target size={20} />,
              label: "Partidas",
              value: data.gamesPlayed.toString(),
              color: "#aa55ff",
            },
            {
              icon: <Shield size={20} />,
              label: "Vitórias PVP",
              value: data.pvpWins.toString(),
              color: "#00cc66",
            },
            {
              icon: <Calendar size={20} />,
              label: "Semanal",
              value: data.weeklyBest.toLocaleString(),
              color: "#0099ff",
            },
          ].map((card, i) => (
            <Box
              key={i}
              sx={{
                flex: "1 1 130px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2.5,
                p: "14px 16px",
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 1,
                  color: card.color,
                }}
              >
                {card.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: card.color,
                  lineHeight: 1,
                }}
              >
                {card.value}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  mt: 0.5,
                }}
              >
                {card.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Score Chart */}
        {data.scoreHistory.length >= 2 && (
          <Box
            sx={{
              mb: 3,
              p: "20px 24px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <TrendingUp size={15} color={data.color} />
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}
              >
                Evolução de Score
              </Typography>
            </Box>
            <MiniChart
              data={data.scoreHistory.map((s) => s.score)}
              color={data.color}
            />
          </Box>
        )}

        {/* Achievements */}
        <Box
          sx={{
            p: "20px 24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Trophy size={15} color={data.color} />
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            >
              Conquistas
            </Typography>
            <Typography
              sx={{
                ml: "auto",
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                fontFamily: "monospace",
              }}
            >
              {achCount}/{ALL_ACHIEVEMENTS.length}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(5,1fr)",
              gap: 1.5,
            }}
          >
            {ALL_ACHIEVEMENTS.map((a) => {
              const unlocked = achSet.has(a.id);
              const icon = ACH_ICONS[a.id];
              return (
                <Box
                  key={a.id}
                  sx={{
                    p: "10px 8px",
                    borderRadius: 2,
                    textAlign: "center",
                    background: unlocked
                      ? "rgba(170,85,255,0.1)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${unlocked ? "rgba(170,85,255,0.35)" : "rgba(255,255,255,0.06)"}`,
                    opacity: unlocked ? 1 : 0.4,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: 0.6,
                      color: unlocked ? "#aa55ff" : "rgba(255,255,255,0.2)",
                    }}
                  >
                    {unlocked ? icon : <Lock size={18} />}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: unlocked ? "#fff" : "rgba(255,255,255,0.3)",
                      lineHeight: 1.2,
                    }}
                  >
                    {a.name}
                  </Typography>
                  {!isMobile && (
                    <Typography
                      sx={{
                        fontSize: 8,
                        color: "rgba(255,255,255,0.25)",
                        mt: 0.3,
                      }}
                    >
                      {a.desc}
                    </Typography>
                  )}
                  {unlocked && (
                    <Box
                      sx={{
                        mt: 0.5,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "#aa55ff",
                        mx: "auto",
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </div>
  );
}
