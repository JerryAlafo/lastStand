"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  ArrowLeft, Swords, Target, Plus, Clock, Trophy, MapPin, Share2, Copy, Check, Zap, BarChart2, Crosshair,
} from "lucide-react";
import { MAPS } from "@/lib/maps";

interface Challenge {
  id: string;
  creator: string;
  mapId: string;
  score: number;
  wave: number;
  kills: number;
  targetScore?: number;
  targetWaves?: number;
  targetKills?: number;
  createdAt: number;
  expiresAt: number;
  status: string;
  isCompleted?: boolean;
  completedBy?: string;
}

export default function ChallengesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isMobile = useMediaQuery("(max-width:640px)");

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [targetScore, setTargetScore] = useState<number>(0);
  const [targetWaves, setTargetWaves] = useState<number>(0);
  const [targetKills, setTargetKills] = useState<number>(0);
  const hasAtLeastOneTarget = targetScore > 0 || targetWaves > 0 || targetKills > 0;
  const [creating, setCreating] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createdChallenge, setCreatedChallenge] = useState<{ id: string; mapName: string } | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/challenges/list")
      .then(r => r.ok ? r.json() : { challenges: [] })
      .then(d => setChallenges(d.challenges ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  async function createChallenge() {
    if (!selectedMap) return;
    setCreating(true);
    try {
      const res = await fetch("/api/challenges/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mapId: selectedMap,
          targetScore: targetScore || undefined,
          targetWaves: targetWaves || undefined,
          targetKills: targetKills || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const map = MAPS.find(m => m.id === selectedMap);
        setCreatedChallenge({ id: data.challenge.id, mapName: map?.namePt ?? selectedMap });
        setChallenges(prev => [{ ...data.challenge, isCompleted: false }, ...prev]);
      }
    } catch {}
    finally { setCreating(false); }
  }

  function joinChallenge(id: string) {
    router.push(`/challenge/${id}`);
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/challenge/${id}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  if (showCreate) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: "28px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
        <Box sx={{ maxWidth: 600, mx: "auto" }}>
          <Button onClick={() => { setShowCreate(false); setCreatedChallenge(null); setSelectedMap(null); setTargetScore(0); setTargetWaves(0); setTargetKills(0); }} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ mb: 3, color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Voltar
          </Button>

          <Typography sx={{ fontSize: 22, fontWeight: 800, mb: 3, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Criar Desafio
          </Typography>

          {createdChallenge ? (
            <Box sx={{ p: "24px", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 3, textAlign: "center" }}>
              <Check size={36} color="#2ecc71" style={{ marginBottom: 12 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>Desafio Criado!</Typography>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", mb: 2 }}>
                {createdChallenge.mapName} · Partilha o link com os teus amigos
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
                <Button onClick={() => copyLink(createdChallenge.id)} variant="outlined" startIcon={copiedId === createdChallenge.id ? <Check size={14} /> : <Copy size={14} />}
                  sx={{ color: "#2ecc71", borderColor: "rgba(46,204,113,0.3)", borderRadius: 2, textTransform: "none" }}>
                  {copiedId === createdChallenge.id ? "Copiado!" : "Copiar Link"}
                </Button>
                <Button onClick={() => joinChallenge(createdChallenge.id)} variant="contained" startIcon={<Swords size={14} />}
                  sx={{ background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", borderRadius: 2, textTransform: "none" }}>
                  Jogar Agora
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)", mb: -1 }}>
                Seleciona o Mapa
              </Typography>
              {MAPS.map(map => (
                <Box key={map.id} onClick={() => setSelectedMap(map.id)}
                  sx={{ p: "14px 16px", borderRadius: 2, cursor: "pointer", border: `1px solid ${selectedMap === map.id ? map.accentColor : "rgba(255,255,255,0.1)"}`, background: selectedMap === map.id ? `${map.accentColor}15` : "rgba(255,255,255,0.03)", transition: "all 0.2s" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <MapPin size={14} color={map.accentColor} />
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{map.namePt}</Typography>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 6, background: "#e74c3c22", border: "1px solid #e74c3c55", color: "#e74c3c", fontWeight: 700 }}>
                      EXTREMO
                    </span>
                  </Box>
                </Box>
              ))}

              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)", mb: 1.5 }}>
                  Objetivos do Desafio
                </Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mb: 2 }}>
                  Deixa em branco os objetivos que não quiseres definir
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Box sx={{ flex: "1 1 160px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                      <Zap size={12} color="#ffd700" />
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Score mínimo</Typography>
                    </Box>
                    <TextField
                      type="number"
                      placeholder="0"
                      value={targetScore || ""}
                      onChange={e => setTargetScore(Number(e.target.value) || 0)}
                      size="small"
                      fullWidth
                      InputProps={{ inputProps: { min: 0 } }}
                      sx={{
                        "& .MuiOutlinedInput-root": { color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: 2, "& fieldset": { borderColor: "rgba(255,255,255,0.12)" } },
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 120px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                      <BarChart2 size={12} color="#f39c12" />
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Wave mínima</Typography>
                    </Box>
                    <TextField
                      type="number"
                      placeholder="0"
                      value={targetWaves || ""}
                      onChange={e => setTargetWaves(Number(e.target.value) || 0)}
                      size="small"
                      fullWidth
                      InputProps={{ inputProps: { min: 0 } }}
                      sx={{
                        "& .MuiOutlinedInput-root": { color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: 2, "& fieldset": { borderColor: "rgba(255,255,255,0.12)" } },
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: "1 1 120px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                      <Crosshair size={12} color="#e74c3c" />
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Kills mínimas</Typography>
                    </Box>
                    <TextField
                      type="number"
                      placeholder="0"
                      value={targetKills || ""}
                      onChange={e => setTargetKills(Number(e.target.value) || 0)}
                      size="small"
                      fullWidth
                      InputProps={{ inputProps: { min: 0 } }}
                      sx={{
                        "& .MuiOutlinedInput-root": { color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: 2, "& fieldset": { borderColor: "rgba(255,255,255,0.12)" } },
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Button onClick={createChallenge} disabled={!selectedMap || !hasAtLeastOneTarget || creating} variant="contained" startIcon={<Swords size={16} />}
                sx={{ mt: 2, background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: 2, fontFamily: "monospace", py: 1.8, borderRadius: 2, textTransform: "none", boxShadow: "0 0 24px rgba(231,76,60,0.4)", opacity: (!selectedMap || !hasAtLeastOneTarget) ? 0.4 : 1 }}>
                {creating ? "A criar..." : "CRIAR DESAFIO"}
              </Button>
            </Box>
          )}
        </Box>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: "28px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ position: "fixed", top: "5%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,165,0,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ maxWidth: 700, mx: "auto", position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button onClick={() => router.push("/game")} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Target size={24} color="#ffa500" style={{ filter: "drop-shadow(0 0 8px #ffa50066)" }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #fff, #ffa500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Desafios
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
          <Button onClick={() => setShowCreate(true)} variant="contained" startIcon={<Plus size={16} />}
            sx={{ flex: 1, background: "linear-gradient(135deg, #7b2ff7, #aa55ff)", color: "#fff", fontSize: 13, fontWeight: 700, py: 1.5, borderRadius: 2, textTransform: "none" }}>
            Criar Desafio
          </Button>
        </Box>

        <Box sx={{ mb: 3, p: "14px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, display: "flex", gap: 1.5 }}>
          <TextField
            placeholder="Cola o ID ou link do desafio..."
            value={joinToken}
            onChange={e => setJoinToken(e.target.value)}
            size="small"
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": { color: "#fff", background: "rgba(255,255,255,0.05)", borderRadius: 2, "& fieldset": { borderColor: "rgba(255,255,255,0.12)" }, "&:hover fieldset": { borderColor: "rgba(255,165,0,0.5)" }, "&.Mui-focused fieldset": { borderColor: "#ffa500" } },
              "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.3)" },
            }}
          />
          <Button onClick={() => {
            const token = joinToken.includes("/challenge/") ? joinToken.split("/challenge/")[1].split("/")[0].split("?")[0] : joinToken.trim();
            if (token) joinChallenge(token);
          }} variant="contained" startIcon={<Swords size={14} />}
            sx={{ background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", fontSize: 12, fontWeight: 700, py: 1.2, borderRadius: 2, textTransform: "none", whiteSpace: "nowrap" }}>
            Entrar
          </Button>
        </Box>

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace", mb: 2 }}>
          Desafios Ativos
        </Typography>

        {loading ? (
          <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, py: 6 }}>A carregar...</Typography>
        ) : challenges.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Swords size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Nenhum desafio ativo.</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: 12, mt: 0.5 }}>Cria um desafio e partilha com os teus amigos!</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {challenges.map(ch => {
              const map = MAPS.find(m => m.id === ch.mapId);
              const timeLeft = Math.max(0, ch.expiresAt - Date.now());
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

              return (
                <Box key={ch.id} sx={{ p: "14px 16px", borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", transition: "all 0.2s", "&:hover": { background: "rgba(255,255,255,0.06)" } }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Swords size={14} color="#aa55ff" />
                      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{ch.creator}</Typography>
                      <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>em</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: map?.accentColor }}>{map?.namePt ?? ch.mapId}</Typography>
                      {map && (
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 6, background: "#e74c3c22", border: "1px solid #e74c3c55", color: "#e74c3c", fontWeight: 700 }}>
                          EXTREMO
                        </span>
                      )}
                      {ch.isCompleted && (
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 6, background: "#2ecc7122", border: "1px solid #2ecc7155", color: "#2ecc71", fontWeight: 700 }}>
                          COMPLETO
                        </span>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button onClick={() => copyLink(ch.id)} startIcon={copiedId === ch.id ? <Check size={14} /> : <Copy size={14} />}
                        sx={{ 
                          color: copiedId === ch.id ? "#2ecc71" : "#fff", 
                          background: copiedId === ch.id ? "rgba(46,204,113,0.2)" : "rgba(255,255,255,0.1)", 
                          border: `1px solid ${copiedId === ch.id ? "rgba(46,204,113,0.5)" : "rgba(255,255,255,0.2)"}`,
                          fontSize: 12, fontWeight: 600, textTransform: "none", minWidth: "auto", px: 2, py: 0.8, borderRadius: 1.5,
                          "&:hover": { background: "rgba(255,255,255,0.15)" }
                        }}>
                        {copiedId === ch.id ? "Copiado!" : "Partilhar"}
                      </Button>
                      <Button onClick={() => joinChallenge(ch.id)} startIcon={<Swords size={14} />}
                        sx={{ 
                          color: "#fff", 
                          background: ch.isCompleted ? "rgba(136,136,136,0.3)" : "linear-gradient(135deg, #c0392b, #e74c3c)", 
                          border: `1px solid ${ch.isCompleted ? "rgba(136,136,136,0.3)" : "rgba(231,76,60,0.5)"}`,
                          fontSize: 12, fontWeight: 700, textTransform: "none", minWidth: "auto", px: 2.5, py: 0.8, borderRadius: 1.5,
                          "&:hover": { background: ch.isCompleted ? "rgba(136,136,136,0.3)" : "linear-gradient(135deg, #a93226, #c0392b)" }
                        }}>
                        Jogar
                      </Button>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    {(ch.targetScore || ch.targetWaves || ch.targetKills) ? (
                      <>
                        {ch.targetScore && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Zap size={10} color="#ffd700" />
                            <Typography sx={{ fontSize: 11, color: "#ffd700", fontWeight: 700 }}>{ch.targetScore.toLocaleString()}</Typography>
                            <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>pts</Typography>
                          </Box>
                        )}
                        {ch.targetWaves && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <BarChart2 size={10} color="#f39c12" />
                            <Typography sx={{ fontSize: 11, color: "#f39c12", fontWeight: 700 }}>{ch.targetWaves}</Typography>
                            <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>waves</Typography>
                          </Box>
                        )}
                        {ch.targetKills && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Crosshair size={10} color="#e74c3c" />
                            <Typography sx={{ fontSize: 11, color: "#e74c3c", fontWeight: 700 }}>{ch.targetKills}</Typography>
                            <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>kills</Typography>
                          </Box>
                        )}
                      </>
                    ) : ch.score > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Trophy size={11} color="#ffd700" />
                        <Typography sx={{ fontSize: 11, color: "#ffd700", fontWeight: 700 }}>{ch.score.toLocaleString()}</Typography>
                        <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>· Wave {ch.wave} · {ch.kills} kills</Typography>
                      </Box>
                    )}
                    {ch.completedBy && (
                      <Typography sx={{ fontSize: 10, color: "#2ecc71" }}>
                        Completo por {ch.completedBy}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
                      <Clock size={11} color="rgba(255,255,255,0.3)" />
                      <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                        {hoursLeft}h {minsLeft}m restante
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </div>
  );
}
