"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  ArrowLeft,
  Users,
  Gamepad2,
  Trophy,
  Crown,
  Swords,
  Zap,
  Star,
  Search,
  Shield,
} from "lucide-react";

interface PlayerStat {
  username: string;
  bestScore: number;
  totalKills: number;
  gamesPlayed: number;
  level?: number;
  title?: string;
  color?: string;
}

interface PvpStat {
  username: string;
  pvpWins: number;
  pvpGamesPlayed: number;
  level?: number;
  title?: string;
  color?: string;
}

interface StatsData {
  totalUsers: number;
  totalGames: number;
  totalPvpGames: number;
  topSolo: PlayerStat[];
  topPvp: PvpStat[];
  soloChampion: PlayerStat | null;
  pvpChampion: PvpStat | null;
}

const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32", "#7b2ff7", "#aa55ff"];
const BAR_GRADIENT = [
  "linear-gradient(90deg,#ffd700,#e0a800)",
  "linear-gradient(90deg,#c0c0c0,#e0e0e0)",
  "linear-gradient(90deg,#cd7f32,#e89050)",
  "linear-gradient(90deg,#7b2ff7,#aa55ff)",
  "linear-gradient(90deg,#7b2ff7,#aa55ff)",
];

function StatCard({
  icon,
  label,
  value,
  color,
  glow,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  glow: string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 130,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 3,
        p: "18px 20px",
        backdropFilter: "blur(12px)",
        boxShadow: `0 0 30px ${glow}`,
        textAlign: "center",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5, color }}>
        {icon}
      </Box>
      <Typography
        sx={{ fontSize: 30, fontWeight: 900, color, mb: 0.5, lineHeight: 1 }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: 11,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontFamily: "monospace",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

type Tab = "solo" | "pvp";

export default function StatsPage() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("solo");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: StatsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredSolo = (data?.topSolo ?? []).filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredPvp = (data?.topPvp ?? []).filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase()),
  );

  const maxSoloScore = data?.topSolo[0]?.bestScore || 1;
  const maxPvpWins = data?.topPvp[0]?.pvpWins || 1;

  // For PVP, show the top player even if they have 0 wins (so the card always renders)
  const champion =
    tab === "solo"
      ? data?.soloChampion
      : (data?.pvpChampion ?? data?.topPvp?.[0] ?? null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 50% 20%, #2a1050 0%, #160830 55%, #0e0520 100%)",
        color: "#fff",
        padding: "28px 20px",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "5%",
          left: "5%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(123,47,247,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ maxWidth: 860, mx: "auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Button
            onClick={() => router.back()}
            startIcon={<ArrowLeft size={16} />}
            variant="outlined"
            sx={{
              color: "rgba(255,255,255,0.6)",
              borderColor: "rgba(255,255,255,0.15)",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.35)",
                bgcolor: "rgba(255,255,255,0.04)",
              },
            }}
          >
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Star
              size={24}
              color="#ffd700"
              style={{ filter: "drop-shadow(0 0 8px #ffd70066)" }}
            />
            <Typography
              sx={{
                fontSize: 24,
                fontWeight: 800,
                background: "linear-gradient(135deg,#fff,#aa55ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: 0.5,
              }}
            >
              Estatísticas
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              textAlign: "center",
              py: 10,
              color: "rgba(255,255,255,0.3)",
              fontSize: 15,
            }}
          >
            A carregar...
          </Box>
        ) : !data ? (
          <Box
            sx={{
              textAlign: "center",
              py: 10,
              color: "rgba(255,100,100,0.7)",
              fontSize: 15,
            }}
          >
            Erro ao carregar dados.
          </Box>
        ) : (
          <>
            {/* Tabs — top, above everything */}
            <Box
              sx={{
                display: "flex",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                mb: 3,
              }}
            >
              {(
                [
                  ["solo", <Trophy size={14} key="t" />, "Solo"],
                  ["pvp", <Swords size={14} key="s" />, "PVP Multiplayer"],
                ] as [Tab, React.ReactNode, string][]
              ).map(([t, icon, label]) => (
                <Box
                  key={t}
                  onClick={() => setTab(t)}
                  sx={{
                    flex: 1,
                    py: 1.4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    transition: "all 0.15s",
                    background:
                      tab === t
                        ? t === "solo"
                          ? "rgba(255,215,0,0.18)"
                          : "rgba(231,76,60,0.18)"
                        : "transparent",
                    color:
                      tab === t
                        ? t === "solo"
                          ? "#ffd700"
                          : "#e74c3c"
                        : "rgba(255,255,255,0.4)",
                    borderBottom:
                      tab === t
                        ? `2px solid ${t === "solo" ? "#ffd700" : "#e74c3c"}`
                        : "2px solid transparent",
                  }}
                >
                  {icon} {label}
                </Box>
              ))}
            </Box>

            {/* Summary cards — 3 per tab, same layout */}
            <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
              <StatCard
                icon={<Users size={26} />}
                label="Utilizadores"
                value={data.totalUsers}
                color="#aa55ff"
                glow="rgba(123,47,247,0.18)"
              />
              {tab === "solo" ? (
                <>
                  <StatCard
                    icon={<Gamepad2 size={26} />}
                    label="Partidas Solo"
                    value={data.totalGames}
                    color="#aa55ff"
                    glow="rgba(123,47,247,0.15)"
                  />
                  <StatCard
                    icon={<Trophy size={26} />}
                    label="Melhor score"
                    value={
                      data.soloChampion?.bestScore?.toLocaleString() ?? "—"
                    }
                    color="#ffd700"
                    glow="rgba(255,215,0,0.2)"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    icon={<Swords size={26} />}
                    label="Partidas PVP"
                    value={data.totalPvpGames}
                    color="#e74c3c"
                    glow="rgba(231,76,60,0.15)"
                  />
                  <StatCard
                    icon={<Shield size={26} />}
                    label="Maior nº vitórias"
                    value={data.topPvp[0]?.pvpWins ?? 0}
                    color="#e74c3c"
                    glow="rgba(231,76,60,0.2)"
                  />
                </>
              )}
            </Box>

            {/* Champion card — always show on PVP tab if there are players */}
            {champion &&
              (tab === "solo" ||
                (tab === "pvp" && data!.topPvp.length > 0)) && (
                <Box
                  sx={{
                    mb: 3,
                    p: "20px 24px",
                    background:
                      tab === "solo"
                        ? "rgba(255,215,0,0.06)"
                        : "rgba(231,76,60,0.06)",
                    border: `1px solid ${tab === "solo" ? "rgba(255,215,0,0.25)" : "rgba(231,76,60,0.25)"}`,
                    borderRadius: 4,
                    backdropFilter: "blur(12px)",
                    boxShadow:
                      tab === "solo"
                        ? "0 0 40px rgba(255,215,0,0.1)"
                        : "0 0 40px rgba(231,76,60,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    flexWrap: "wrap",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        tab === "solo"
                          ? "linear-gradient(135deg,#ffd700,#ff8800)"
                          : "linear-gradient(135deg,#e74c3c,#c0392b)",
                      boxShadow:
                        tab === "solo"
                          ? "0 0 24px rgba(255,215,0,0.5)"
                          : "0 0 24px rgba(231,76,60,0.5)",
                    }}
                  >
                    {tab === "solo" ? (
                      <Crown size={26} color="#fff" />
                    ) : (
                      <Shield size={26} color="#fff" />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        letterSpacing: 2.5,
                        color:
                          tab === "solo"
                            ? "rgba(255,215,0,0.7)"
                            : "rgba(231,76,60,0.7)",
                        textTransform: "uppercase",
                        fontFamily: "monospace",
                        mb: 0.5,
                      }}
                    >
                      {tab === "solo"
                        ? "Campeão Solo"
                        : (champion as PvpStat).pvpWins > 0
                          ? "Campeão PVP"
                          : "Líder PVP"}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: tab === "solo" ? "#ffd700" : "#e74c3c",
                      }}
                    >
                      {champion.username}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {tab === "solo" ? (
                      <>
                        <Box sx={{ textAlign: "center" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mb: 0.3,
                            }}
                          >
                            <Zap size={13} color="#ffd700" />
                            <Typography
                              sx={{
                                fontSize: 18,
                                fontWeight: 900,
                                color: "#ffd700",
                              }}
                            >
                              {(
                                champion as PlayerStat
                              ).bestScore.toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.35)",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Melhor score
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mb: 0.3,
                            }}
                          >
                            <Swords size={13} color="#e74c3c" />
                            <Typography
                              sx={{
                                fontSize: 18,
                                fontWeight: 900,
                                color: "#e74c3c",
                              }}
                            >
                              {(
                                champion as PlayerStat
                              ).totalKills.toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.35)",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Total kills
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box sx={{ textAlign: "center" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mb: 0.3,
                            }}
                          >
                            <Trophy size={13} color="#e74c3c" />
                            <Typography
                              sx={{
                                fontSize: 18,
                                fontWeight: 900,
                                color: "#e74c3c",
                              }}
                            >
                              {(champion as PvpStat).pvpWins}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.35)",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Vitórias PVP
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mb: 0.3,
                            }}
                          >
                            <Gamepad2 size={13} color="#aa55ff" />
                            <Typography
                              sx={{
                                fontSize: 18,
                                fontWeight: 900,
                                color: "#aa55ff",
                              }}
                            >
                              {(champion as PvpStat).pvpGamesPlayed}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.35)",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Partidas PVP
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              )}

            {/* Search filter */}
            <Box sx={{ mb: 2 }}>
              <TextField
                placeholder="Pesquisar jogador…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Search
                      size={15}
                      style={{
                        marginRight: 8,
                        color: "rgba(255,255,255,0.35)",
                      }}
                    />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 2,
                    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                    "&:hover fieldset": { borderColor: "rgba(123,47,247,0.5)" },
                    "&.Mui-focused fieldset": { borderColor: "#7b2ff7" },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "rgba(255,255,255,0.3)",
                  },
                }}
              />
            </Box>

            {/* Rankings */}
            <Box
              sx={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 4,
                p: "22px 24px",
                backdropFilter: "blur(12px)",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  mb: 2.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {tab === "solo" ? (
                  <>
                    <Trophy size={15} color="#ffd700" /> Ranking Solo
                  </>
                ) : (
                  <>
                    <Swords size={15} color="#e74c3c" /> Ranking PVP
                  </>
                )}
              </Typography>

              {tab === "solo" ? (
                filteredSolo.length === 0 ? (
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 14,
                      textAlign: "center",
                      py: 3,
                    }}
                  >
                    Nenhum jogador encontrado.
                  </Typography>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}
                  >
                    {filteredSolo.map((p, i) => {
                      const realRank = data!.topSolo.findIndex(
                        (x) => x.username === p.username,
                      );
                      const pct = Math.max(
                        6,
                        (p.bestScore / maxSoloScore) * 100,
                      );
                      const color = RANK_COLORS[realRank] ?? "#7b2ff7";
                      const grad =
                        BAR_GRADIENT[realRank] ??
                        "linear-gradient(90deg,#7b2ff7,#aa55ff)";
                      return (
                        <Box
                          key={p.username}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: isMobile ? 1 : 2,
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              width: 20,
                              fontSize: 13,
                              fontWeight: 800,
                              color,
                              textAlign: "right",
                              flexShrink: 0,
                            }}
                          >
                            {realRank + 1}
                          </Typography>
                          <Box sx={{ width: isMobile ? 80 : 120, flexShrink: 0, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: isMobile ? 13 : 14,
                                fontWeight: 600,
                                color: "#fff",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.username}
                            </Typography>
                            {p.title && (
                              <Typography sx={{ fontSize: 9, fontWeight: 700, color: p.color ?? "#888", lineHeight: 1.2, letterSpacing: 0.5 }}>
                                {p.title}
                              </Typography>
                            )}
                          </Box>
                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              height: 18,
                              background: "rgba(255,255,255,0.06)",
                              borderRadius: 10,
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                height: "100%",
                                width: `${pct}%`,
                                borderRadius: 10,
                                background: grad,
                                boxShadow: `0 0 10px ${color}66`,
                                transition:
                                  "width 0.8s cubic-bezier(.4,0,.2,1)",
                              }}
                            />
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              width: isMobile ? 70 : 90,
                              justifyContent: "flex-end",
                              flexShrink: 0,
                            }}
                          >
                            <Zap size={11} color={color} />
                            <Typography
                              sx={{
                                fontSize: isMobile ? 12 : 14,
                                fontWeight: 700,
                                color,
                              }}
                            >
                              {p.bestScore.toLocaleString()}
                            </Typography>
                          </Box>
                          {!isMobile && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                width: 70,
                                justifyContent: "flex-end",
                                flexShrink: 0,
                              }}
                            >
                              <Swords size={11} color="#e74c3c" />
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: "rgba(255,255,255,0.45)",
                                }}
                              >
                                {p.totalKills}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )
              ) : filteredPvp.length === 0 ? (
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 14,
                    textAlign: "center",
                    py: 3,
                  }}
                >
                  Nenhum jogador encontrado.
                </Typography>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}
                >
                  {filteredPvp.map((p, i) => {
                    const realRank = data!.topPvp.findIndex(
                      (x) => x.username === p.username,
                    );
                    const pct = Math.max(
                      p.pvpWins > 0 ? 6 : 2,
                      (p.pvpWins / maxPvpWins) * 100,
                    );
                    const color =
                      p.pvpWins > 0
                        ? (RANK_COLORS[realRank] ?? "#7b2ff7")
                        : "rgba(255,255,255,0.2)";
                    const grad =
                      p.pvpWins > 0
                        ? (BAR_GRADIENT[realRank] ??
                          "linear-gradient(90deg,#e74c3c,#c0392b)")
                        : "rgba(255,255,255,0.06)";
                    return (
                      <Box
                        key={p.username}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: isMobile ? 1 : 2,
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          sx={{
                            width: 20,
                            fontSize: 13,
                            fontWeight: 800,
                            color,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {realRank + 1}
                        </Typography>
                        <Box sx={{ width: isMobile ? 80 : 120, flexShrink: 0, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: isMobile ? 13 : 14,
                              fontWeight: 600,
                              color: "#fff",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.username}
                          </Typography>
                          {p.title && (
                            <Typography sx={{ fontSize: 9, fontWeight: 700, color: p.color ?? "#888", lineHeight: 1.2, letterSpacing: 0.5 }}>
                              {p.title}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            height: 18,
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 10,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              height: "100%",
                              width: `${pct}%`,
                              borderRadius: 10,
                              background: grad,
                              boxShadow:
                                p.pvpWins > 0 ? `0 0 10px ${color}66` : "none",
                              transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            width: isMobile ? 60 : 80,
                            justifyContent: "flex-end",
                            flexShrink: 0,
                          }}
                        >
                          <Trophy size={11} color={color} />
                          <Typography
                            sx={{
                              fontSize: isMobile ? 12 : 14,
                              fontWeight: 700,
                              color,
                            }}
                          >
                            {p.pvpWins}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  mt: 3,
                  pt: 2,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  flexWrap: "wrap",
                }}
              >
                {tab === "solo" ? (
                  <>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
                    >
                      <Zap size={13} color="#ffd700" />
                      <Typography
                        sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}
                      >
                        Melhor score
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
                    >
                      <Swords size={13} color="#e74c3c" />
                      <Typography
                        sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}
                      >
                        Total de kills
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Trophy size={13} color="#e74c3c" />
                    <Typography
                      sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}
                    >
                      Vitórias em PVP
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Typography
              sx={{
                mt: 3,
                textAlign: "center",
                fontSize: 12,
                color: "rgba(255,255,255,0.18)",
              }}
            >
              Todos os jogadores · Last Stand Arena
            </Typography>
          </>
        )}
      </Box>
    </div>
  );
}
