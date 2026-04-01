"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Trophy, ArrowLeft, Crown, Swords, Zap } from "lucide-react";

type ScoreRow = {
  rank: number;
  username: string;
  score: number;
  wave: number;
  kills: number;
  date: string;
};

const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32"];
const RANK_ICONS = [
  <Crown key={1} size={14} color="#ffd700" />,
  <Crown key={2} size={14} color="#c0c0c0" />,
  <Crown key={3} size={14} color="#cd7f32" />,
];

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:640px)");
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      const res = await fetch("/api/scores/leaderboard");
      const json = (await res.json()) as { scores: Omit<ScoreRow, "rank">[] };
      setRows(json.scores.map((s, i) => ({ rank: i + 1, ...s })));
      setLoading(false);
    })();
  }, [status]);

  const me = session?.user?.username;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)",
        color: "#fff",
        padding: "28px 20px",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Decorative glows */}
      <div style={{ position: "fixed", top: "5%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ maxWidth: 820, mx: "auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Button
            onClick={() => router.push("/game")}
            startIcon={<ArrowLeft size={16} />}
            variant="outlined"
            sx={{
              color: "rgba(255,255,255,0.7)",
              borderColor: "rgba(255,255,255,0.15)",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": { borderColor: "rgba(255,255,255,0.35)", bgcolor: "rgba(255,255,255,0.05)" },
            }}
          >
            Voltar
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Trophy size={26} color="#ffd700" style={{ filter: "drop-shadow(0 0 8px #ffd70066)" }} />
            <Typography
              sx={{
                fontSize: 26,
                fontWeight: 800,
                background: "linear-gradient(135deg, #fff, #aa55ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: 1,
              }}
            >
              Leaderboard
            </Typography>
          </Box>
        </Box>

        {/* Table card */}
        <Box
          sx={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3,
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 60px rgba(123,47,247,0.1), 0 8px 32px rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "44px 1fr 90px 70px" : "60px 1fr 120px 90px 90px 140px",
              px: isMobile ? 1.5 : 2.5,
              py: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {(isMobile ? ["#", "Jogador", "Score", "Kills"] : ["#", "Jogador", "Score", "Wave", "Kills", "Data"]).map((h) => (
              <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "rgba(200,150,255,0.75)", textTransform: "uppercase" }}>
                {h}
              </Typography>
            ))}
          </Box>

          {/* Rows */}
          {loading ? (
            <Box sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              A carregar...
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              Nenhum score registado ainda.
            </Box>
          ) : (
            rows.map((r) => {
              const isMe = me && r.username === me;
              const rankColor = RANK_COLORS[r.rank - 1];
              return (
                <Box
                  key={`${r.username}-${r.date}-${r.score}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "44px 1fr 90px 70px" : "60px 1fr 120px 90px 90px 140px",
                    px: isMobile ? 1.5 : 2.5,
                    py: 1.6,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: isMe
                      ? "rgba(123,47,247,0.12)"
                      : r.rank <= 3
                      ? "rgba(255,255,255,0.015)"
                      : "transparent",
                    transition: "background 0.2s",
                    alignItems: "center",
                    "&:hover": { background: isMe ? "rgba(123,47,247,0.18)" : "rgba(255,255,255,0.03)" },
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  {/* Rank */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {r.rank <= 3 ? RANK_ICONS[r.rank - 1] : null}
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: rankColor ?? "rgba(255,255,255,0.4)" }}>
                      {r.rank}
                    </Typography>
                  </Box>

                  {/* Username */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 28, height: 28, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800,
                        background: isMe ? "rgba(123,47,247,0.4)" : "rgba(255,255,255,0.07)",
                        border: isMe ? "1px solid rgba(123,47,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
                        color: isMe ? "#aa55ff" : "rgba(255,255,255,0.6)",
                        flexShrink: 0,
                      }}
                    >
                      {r.username.slice(0, 2).toUpperCase()}
                    </Box>
                    <Typography sx={{ fontSize: 14, fontWeight: isMe ? 700 : 400, color: isMe ? "#aa55ff" : "rgba(255,255,255,0.9)" }}>
                      {r.username}
                      {isMe && <span style={{ fontSize: 10, marginLeft: 6, color: "rgba(200,150,255,0.75)" }}>tu</span>}
                    </Typography>
                  </Box>

                  {/* Score */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Zap size={12} color="#ffd700" />
                    <Typography sx={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "#ffd700" }}>{r.score.toLocaleString()}</Typography>
                  </Box>

                  {/* Wave (desktop only) */}
                  {!isMobile && <Typography sx={{ fontSize: 14, color: "#f39c12", fontWeight: 600 }}>{r.wave}</Typography>}

                  {/* Kills */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Swords size={12} color="#e74c3c" />
                    <Typography sx={{ fontSize: isMobile ? 13 : 14, color: "#e74c3c", fontWeight: 600 }}>{r.kills}</Typography>
                  </Box>

                  {/* Date (desktop only) */}
                  {!isMobile && (
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                      {new Date(r.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                  )}
                </Box>
              );
            })
          )}
        </Box>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            Top 10 scores globais · Last Stand Arena
          </Typography>
          <a href="/contact" style={{ textDecoration: "none" }}>
            <Typography sx={{ fontSize: 12, color: "rgba(123,47,247,0.4)", "&:hover": { color: "#aa55ff" }, transition: "color 0.2s", cursor: "pointer" }}>
              Contacto
            </Typography>
          </a>
        </Box>
      </Box>
    </div>
  );
}
