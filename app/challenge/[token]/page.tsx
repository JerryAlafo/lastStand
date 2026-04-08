"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowLeft, Swords, Clock, MapPin, Trophy, Share2, Play, AlertTriangle, CheckCircle2, Zap, BarChart2, Crosshair, Skull, RotateCcw } from "lucide-react";
import { getMapById } from "@/lib/maps";

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
  targetScore?: number;
  targetWaves?: number;
  targetKills?: number;
  createdAt: number;
  expiresAt: number;
  status: string;
  completedBy?: string;
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
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [challengeEnded, setChallengeEnded] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/challenges/${encodeURIComponent(token)}`)
      .then(r => {
        if (r.status === 410) { setExpired(true); return null; }
        if (!r.ok) throw new Error("Desafio não encontrado.");
        return r.json();
      })
      .then(d => { 
        if (d?.challenge) {
          setChallenge(d.challenge);
          if (d.challenge.completedBy) {
            setAlreadyCompleted(true);
          }
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handlePlay = useCallback(() => {
    if (!challenge) return;
    setPlaying(true);
  }, [challenge]);

  const handleGameOver = useCallback(async (score: number, wave: number, kills: number) => {
    if (!challenge) return;
    setChallengeEnded(true);
    try {
      const res = await fetch(`/api/challenges/${encodeURIComponent(challenge.id)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, wave, kills }),
      });
      const data = await res.json();
      if (data.completedAllTargets) {
        setLastScore(score);
        setShowCompletedModal(true);
      }
    } catch {}
  }, [challenge]);

  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/challenge?token=${token}` : "";

  if (playing && challenge && !challengeEnded) {
    return (
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0008" }}>
        <GameScene challengeProps={{ challengeMode: true, mapId: challenge.mapId, challengeToken: token, seed: challenge.seed, onGameOver: handleGameOver }} />
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

  if (showCompletedModal) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 35%, rgba(46,204,113,0.15) 0%, #0a0010 60%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Segoe UI', sans-serif", padding: 20, backdropFilter: "blur(16px)" }}>
        <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(46,204,113,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
        <CheckCircle2 size={64} color="#2ecc71" style={{ filter: "drop-shadow(0 0 20px #2ecc71)" }} />
        <Typography sx={{ fontSize: 28, fontWeight: 900, color: "#2ecc71", textShadow: "0 0 28px rgba(46,204,113,0.5)" }}>
          DESAFIO CONCLUÍDO!
        </Typography>
        <Box sx={{ textAlign: "center", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 3, p: "16px 32px" }}>
          <Typography sx={{ fontSize: 16, color: "rgba(255,255,255,0.6)", mb: 1 }}>Score</Typography>
          <Typography sx={{ fontSize: 36, fontWeight: 900, color: "#ffd700" }}>{lastScore.toLocaleString()}</Typography>
        </Box>
        <Button onClick={() => router.push("/challenges")} variant="contained" startIcon={<Swords size={16} />}
          sx={{ background: "linear-gradient(135deg, #2ecc71, #27ae60)", color: "#fff", fontSize: 14, fontWeight: 700, borderRadius: 2, textTransform: "none", px: 4, py: 1.5 }}>
          Ver Desafios
        </Button>
      </div>
    );
  }

  if (challengeEnded) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 35%, rgba(50,10,20,0.97) 0%, #0a0010 60%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Segoe UI', sans-serif", padding: 20, backdropFilter: "blur(16px)" }}>
        <div style={{ position: "absolute", top: "12%", right: "10%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(231,76,60,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <Skull size={isMobile ? 42 : 56} color="#e74c3c" strokeWidth={1.5} />
        <Typography sx={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: "#e74c3c", textShadow: "0 0 28px #e74c3c99" }}>
          ELIMINADO
        </Typography>
        <Box sx={{ textAlign: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: "16px 32px" }}>
          <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Não completaste os objectivos do desafio.</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
          <Button onClick={() => { setChallengeEnded(false); setPlaying(true); }} variant="contained" startIcon={<RotateCcw size={16} />}
            sx={{ background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", fontSize: 13, fontWeight: 700, borderRadius: 2, textTransform: "none", px: 3, py: 1.2 }}>
            Tentar de Novo
          </Button>
          <Button onClick={() => router.push("/challenges")} variant="outlined" startIcon={<ArrowLeft size={16} />}
            sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none", px: 3, py: 1.2 }}>
            Ver Desafios
          </Button>
        </Box>
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
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#e74c3c22", border: "1px solid #e74c3c55", color: "#e74c3c", fontWeight: 700 }}>
                EXTREMO
              </span>
            )}
          </Box>

          {(challenge.targetScore || challenge.targetWaves || challenge.targetKills) ? (
            <Box sx={{ display: "flex", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
              {challenge.targetScore && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Zap size={14} color="#ffd700" />
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#ffd700" }}>{challenge.targetScore.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>pts</Typography>
                </Box>
              )}
              {challenge.targetWaves && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <BarChart2 size={14} color="#f39c12" />
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#f39c12" }}>{challenge.targetWaves}</Typography>
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>waves</Typography>
                </Box>
              )}
              {challenge.targetKills && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Crosshair size={14} color="#e74c3c" />
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#e74c3c" }}>{challenge.targetKills}</Typography>
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>kills</Typography>
                </Box>
              )}
            </Box>
          ) : (
            challenge.score > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Trophy size={16} color="#ffd700" />
                <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Score para bater:</Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#ffd700" }}>{challenge.score.toLocaleString()}</Typography>
              </Box>
            )
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Clock size={16} color="#f39c12" />
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Expira em {hoursLeft}h {minsLeft}m
            </Typography>
          </Box>
        </Box>

        {alreadyCompleted ? (
          <Box sx={{ p: "16px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 3, textAlign: "center", mb: 2 }}>
            <Typography sx={{ fontSize: 14, color: "#e74c3c", fontWeight: 700, mb: 0.5 }}>Este desafio já foi completado</Typography>
            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Por: {challenge.completedBy}</Typography>
          </Box>
        ) : (
          <Button onClick={handlePlay} variant="contained" startIcon={<Play size={18} />}
            sx={{ width: "100%", mb: 2, background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: 2, fontFamily: "monospace", py: 2, borderRadius: 2, textTransform: "none", boxShadow: "0 0 32px rgba(231,76,60,0.55)" }}>
            ACEITAR DESAFIO
          </Button>
        )}

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
