"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowLeft, Swords, Clock, MapPin, Trophy, Share2, Play, AlertTriangle } from "lucide-react";
import { getMapById, getDifficultyColor, getDifficultyLabel } from "@/lib/maps";

const GameScene = dynamic(() => import("@/components/game/GameScene"), { ssr: false, loading: () => <div style={{ width: "100vw", height: "100vh", background: "#0a0008", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "monospace" }}>A carregar...</div> });

interface ChallengeInfo {
  id: string;
  creator: string;
  mapId: string;
  mapName: string;
  seed: number;
  score: number;
  wave: number;
  kills: number;
  createdAt: number;
  expiresAt: number;
  status: string;
}

export default function ChallengePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const isMobile = useMediaQuery("(max-width:640px)");

  const token = (params?.token as string) ?? "";
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/challenges/${encodeURIComponent(token)}`)
      .then(r => {
        if (r.status === 410) { setExpired(true); return null; }
        if (!r.ok) throw new Error("Desafio não encontrado.");
        return r.json();
      })
      .then(d => { if (d?.challenge) setChallenge(d.challenge); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handlePlay = useCallback(() => {
    if (!challenge) return;
    setPlaying(true);
  }, [challenge]);

  const handleGameOver = useCallback(async (score: number, wave: number, kills: number) => {
    if (!challenge) return;
    try {
      await fetch(`/api/challenges/${encodeURIComponent(challenge.id)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, wave, kills }),
      });
    } catch {}
  }, [challenge]);

  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/challenge?token=${token}` : "";

  if (playing && challenge) {
    return (
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0008" }}>
        <GameScene challengeProps={{ challengeMode: true, mapId: challenge.mapId, seed: challenge.seed, onGameOver: handleGameOver }} />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        A carregar desafio...
      </div>
    );
  }

  if (expired) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Segoe UI', sans-serif", padding: 20 }}>
        <AlertTriangle size={48} color="#f39c12" />
        <Typography sx={{ fontSize: 22, fontWeight: 800 }}>Desafio Expirado</Typography>
        <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>Este desafio expirou após 24 horas.</Typography>
        <Button onClick={() => router.push("/game")} variant="outlined" sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
          Voltar ao Jogo
        </Button>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Segoe UI', sans-serif", padding: 20 }}>
        <Typography sx={{ fontSize: 18, color: "rgba(255,100,100,0.7)" }}>{error ?? "Desafio não encontrado."}</Typography>
        <Button onClick={() => router.push("/game")} variant="outlined" sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
          Voltar ao Jogo
        </Button>
      </div>
    );
  }

  const map = getMapById(challenge.mapId);
  const timeLeft = Math.max(0, challenge.expiresAt - Date.now());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: "28px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <Box sx={{ maxWidth: 500, mx: "auto" }}>
        <Button onClick={() => router.push("/game")} startIcon={<ArrowLeft size={16} />} variant="outlined"
          sx={{ mb: 3, color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
          Voltar
        </Button>

        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Swords size={40} color={map?.accentColor ?? "#7b2ff7"} style={{ filter: `drop-shadow(0 0 12px ${map?.accentColor ?? "#7b2ff7"}66)` }} />
          <Typography sx={{ fontSize: 24, fontWeight: 900, mt: 1, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Desafio de Amigo
          </Typography>
        </Box>

        <Box sx={{ mb: 3, p: "20px 24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Desafiado por</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#aa55ff" }}>{challenge.creator}</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <MapPin size={16} color={map?.accentColor} />
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{challenge.mapName}</Typography>
            {map && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: `${getDifficultyColor(map.difficulty)}22`, border: `1px solid ${getDifficultyColor(map.difficulty)}55`, color: getDifficultyColor(map.difficulty), fontWeight: 700 }}>
                {getDifficultyLabel(map.difficulty)}
              </span>
            )}
          </Box>

          {challenge.score > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Trophy size={16} color="#ffd700" />
              <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Score para bater:</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#ffd700" }}>{challenge.score.toLocaleString()}</Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Clock size={16} color="#f39c12" />
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Expira em {hoursLeft}h {minsLeft}m
            </Typography>
          </Box>
        </Box>

        <Button onClick={handlePlay} variant="contained" startIcon={<Play size={18} />}
          sx={{ width: "100%", mb: 2, background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: 2, fontFamily: "monospace", py: 2, borderRadius: 2, textTransform: "none", boxShadow: "0 0 32px rgba(231,76,60,0.55)" }}>
          ACEITAR DESAFIO
        </Button>

        {status === "authenticated" && (
          <Button onClick={() => { navigator.clipboard?.writeText(shareLink); }} variant="outlined" startIcon={<Share2 size={16} />}
            sx={{ width: "100%", color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Partilhar Desafio
          </Button>
        )}
      </Box>
    </div>
  );
}
