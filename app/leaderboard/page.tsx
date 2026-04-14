"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Trophy, ArrowLeft, Crown, Swords, Zap } from "lucide-react";
import { getLevelTitle, getLevelColor } from "@/lib/levelSystem";

type ScoreRow = { rank: number; username: string; score: number; wave: number; kills: number; date?: string; weekId?: string; streak?: number };
type LevelMap = Record<string, { level: number; title: string; color: string }>;
type RivalsData = {
  me: { rank: number; username: string; score: number } | null;
  above: { rank: number; username: string; score: number } | null;
  below: { rank: number; username: string; score: number } | null;
  gapToAbove: number | null;
  message: string;
  mode: "global" | "weekly";
};

const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32"];
const RANK_ICONS  = [<Crown key={1} size={14} color="#ffd700" />, <Crown key={2} size={14} color="#c0c0c0" />, <Crown key={3} size={14} color="#cd7f32" />];

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const isMobile = useMediaQuery("(max-width:640px)");

  const [tab,      setTab]      = useState<"global" | "weekly" | "rivals">("global");
  const [rows,     setRows]     = useState<ScoreRow[]>([]);
  const [weekRows, setWeekRows] = useState<ScoreRow[]>([]);
  const [levels,   setLevels]   = useState<LevelMap>({});
  const [loading,  setLoading]  = useState(true);
  const [rivals, setRivals] = useState<RivalsData | null>(null);
  const [rivalsLoading, setRivalsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const [gl, wk, lv] = await Promise.all([
          fetch("/api/scores/leaderboard").then(r => r.ok ? r.json() : { scores: [] }),
          fetch("/api/scores/weekly").then(r => r.ok ? r.json() : { scores: [] }),
          fetch("/api/user/level").then(r => r.ok ? r.json() : null),
        ]);
        setRows((gl.scores ?? []).map((s: Omit<ScoreRow, "rank">, i: number) => ({ rank: i + 1, ...s })));
        setWeekRows((wk.scores ?? []).map((s: Omit<ScoreRow, "rank">, i: number) => ({ rank: i + 1, ...s })));
        if (lv) setLevels({ [session?.user?.username ?? ""]: { level: lv.level, title: getLevelTitle(lv.level), color: getLevelColor(lv.level) } });
      } catch {
        // show empty tables rather than freezing
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  useEffect(() => {
    if (tab !== "rivals" || status !== "authenticated") return;
    setRivalsLoading(true);
    fetch("/api/scores/rivals?mode=global")
      .then(r => r.ok ? r.json() : null)
      .then(setRivals)
      .catch(() => setRivals(null))
      .finally(() => setRivalsLoading(false));
  }, [tab, status]);

  const me       = session?.user?.username;
  const display  = tab === "weekly" ? weekRows : rows;

  function LevelBadge({ username }: { username: string }) {
    const lv = levels[username];
    if (!lv) return null;
    return (
      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 8, marginLeft: 6, background: `${lv.color}22`, border: `1px solid ${lv.color}55`, color: lv.color }}>
        Nv.{lv.level}
      </span>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: "28px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ position: "fixed", top: "5%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ maxWidth: 820, mx: "auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button onClick={() => router.push("/game")} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "rgba(255,255,255,0.35)", bgcolor: "rgba(255,255,255,0.05)" } }}>
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Trophy size={26} color="#ffd700" style={{ filter: "drop-shadow(0 0 8px #ffd70066)" }} />
            <Typography sx={{ fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 1 }}>
              Leaderboard
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          {(["global", "weekly", "rivals"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "monospace", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
              background: tab === t ? "rgba(123,47,247,0.3)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${tab === t ? "rgba(123,47,247,0.6)" : "rgba(255,255,255,0.1)"}`,
              color: tab === t ? "#aa77ff" : "rgba(255,255,255,0.5)",
              transition: "all 0.2s",
            }}>
              {t === "global" ? "🌍 Global" : t === "weekly" ? "📅 Semanal" : "🎯 Rivais"}
            </button>
          ))}

          {tab === "weekly" && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", alignSelf: "center" }}>
              Reseta toda segunda-feira
            </span>
          )}
        </Box>

        {tab === "rivals" ? (
          <Box sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
            <Button onClick={async () => {
              setRivalsLoading(true);
              const d = await fetch("/api/scores/rivals?mode=global").then(r => r.json());
              setRivals(d);
              setRivalsLoading(false);
            }} sx={{ mb: 1.5, textTransform: "none" }} variant="outlined">Atualizar rivalidade</Button>
            {rivalsLoading ? (
              <Box sx={{ py: 4, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>A carregar...</Box>
            ) : (
              <>
                <Typography sx={{ color: "#ffd700", mb: 2 }}>{rivals?.message ?? "Clica em atualizar para ver quem está acima e abaixo de ti."}</Typography>
                {[rivals?.above, rivals?.me, rivals?.below].map((r, idx) => (
                  <Box key={idx} sx={{ p: 1.2, mb: 1, borderRadius: 2, border: "1px solid rgba(255,255,255,0.1)", bgcolor: idx === 1 ? "rgba(123,47,247,0.16)" : "rgba(255,255,255,0.03)" }}>
                    {r ? (
                      <Typography>{r.rank}. {r.username} — {r.score.toLocaleString()} pts</Typography>
                    ) : (
                      <Typography sx={{ color: "rgba(255,255,255,0.35)" }}>—</Typography>
                    )}
                  </Box>
                ))}
              </>
            )}
          </Box>
        ) : (
        <Box sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, backdropFilter: "blur(12px)", boxShadow: "0 0 60px rgba(123,47,247,0.1), 0 8px 32px rgba(0,0,0,0.4)", overflow: "hidden" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: isMobile ? "44px 1fr 90px 70px" : "60px 1fr 120px 90px 90px 140px", px: isMobile ? 1.5 : 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            {(isMobile ? ["#", "Jogador", "Score", "Kills"] : ["#", "Jogador", "Score", "Wave", "Kills", "Data"]).map(h => (
              <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "rgba(200,150,255,0.75)", textTransform: "uppercase" }}>{h}</Typography>
            ))}
          </Box>

          {loading ? (
            <Box sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>A carregar...</Box>
          ) : display.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Nenhum score registado.</Box>
          ) : display.map(r => {
            const isMe      = me && r.username === me;
            const rankColor = RANK_COLORS[r.rank - 1];
            return (
              <Box
                key={`${r.username}-${r.rank}`}
                onClick={() => router.push(`/perfil/${encodeURIComponent(r.username)}`)}
                sx={{ display: "grid", gridTemplateColumns: isMobile ? "44px 1fr 90px 70px" : "60px 1fr 120px 90px 90px 140px", px: isMobile ? 1.5 : 2.5, py: 1.6, borderBottom: "1px solid rgba(255,255,255,0.04)", background: isMe ? "rgba(123,47,247,0.12)" : r.rank <= 3 ? "rgba(255,255,255,0.015)" : "transparent", transition: "background 0.2s", alignItems: "center", cursor: "pointer", "&:hover": { background: isMe ? "rgba(123,47,247,0.18)" : "rgba(255,255,255,0.05)" }, "&:last-child": { borderBottom: "none" } }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {r.rank <= 3 ? RANK_ICONS[r.rank - 1] : null}
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: rankColor ?? "rgba(255,255,255,0.4)" }}>{r.rank}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: isMe ? "rgba(123,47,247,0.4)" : "rgba(255,255,255,0.07)", border: isMe ? "1px solid rgba(123,47,247,0.4)" : "1px solid rgba(255,255,255,0.08)", color: isMe ? "#aa55ff" : "rgba(255,255,255,0.6)", flexShrink: 0 }}>
                    {r.username.slice(0, 2).toUpperCase()}
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: isMe ? 700 : 400, color: isMe ? "#aa55ff" : "rgba(255,255,255,0.9)" }}>
                    {r.username}
                    {isMe && <span style={{ fontSize: 10, marginLeft: 6, color: "rgba(200,150,255,0.75)" }}>tu</span>}
                    {isMe && <LevelBadge username={r.username} />}
                    {tab === "weekly" && r.rank === 1 && <Crown size={13} color="#ffd700" style={{ marginLeft: 6, verticalAlign: "middle" }} />}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Zap size={12} color="#ffd700" />
                  <Typography sx={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "#ffd700" }}>{r.score.toLocaleString()}</Typography>
                  {!!r.streak && <Typography sx={{ fontSize: 11, color: "#ff8c00", ml: 0.5 }}>🔥 {r.streak}</Typography>}
                </Box>
                {!isMobile && <Typography sx={{ fontSize: 14, color: "#f39c12", fontWeight: 600 }}>{r.wave}</Typography>}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Swords size={12} color="#e74c3c" />
                  <Typography sx={{ fontSize: isMobile ? 13 : 14, color: "#e74c3c", fontWeight: 600 }}>{r.kills}</Typography>
                </Box>
                {!isMobile && r.date && (
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                    {new Date(r.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                  </Typography>
                )}
                {!isMobile && !r.date && <span />}
              </Box>
            );
          })}
        </Box>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}>
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            {tab === "global" ? "Scores globais" : "Scores desta semana"} · Last Stand Arena
          </Typography>
          <a href="/records" style={{ textDecoration: "none" }}><Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Mural de Recordes</Typography></a>
          <a href="/contact" style={{ textDecoration: "none" }}>
            <Typography sx={{ fontSize: 12, color: "rgba(123,47,247,0.4)", "&:hover": { color: "#aa55ff" }, transition: "color 0.2s", cursor: "pointer" }}>Contacto</Typography>
          </a>
        </Box>
      </Box>
    </div>
  );
}
