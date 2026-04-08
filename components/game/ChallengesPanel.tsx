"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ArrowLeft, Swords, MapPin, Share2, Plus, Clock, Trophy } from "lucide-react";
import { MAPS } from "@/lib/maps";

interface Challenge {
  id: string;
  creator: string;
  mapId: string;
  mapName: string;
  score: number;
  expiresAt: number;
}

export default function ChallengesPanel({
  onBack,
  onCreateChallenge,
  onJoinChallenge,
  challenges,
  loading,
}: {
  onBack: () => void;
  onCreateChallenge: (mapId: string) => void;
  onJoinChallenge: (token: string) => void;
  challenges: Challenge[];
  loading: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState("");

  if (showCreate) {
    return (
      <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 35%, rgba(42,16,80,0.98) 0%, rgba(14,5,32,0.99) 60%, rgba(8,2,20,0.99) 100%)", backdropFilter: "blur(16px)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Box sx={{ maxWidth: 500, width: "100%" }}>
          <Button onClick={() => setShowCreate(false)} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ mb: 3, color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Voltar
          </Button>

          <Typography sx={{ fontSize: 20, fontWeight: 800, mb: 3, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Criar Desafio
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {MAPS.map(map => (
              <Box key={map.id} onClick={() => setSelectedMap(map.id)}
                sx={{ p: "14px 16px", borderRadius: 2, cursor: "pointer", border: `1px solid ${selectedMap === map.id ? map.accentColor : "rgba(255,255,255,0.1)"}`, background: selectedMap === map.id ? `${map.accentColor}15` : "rgba(255,255,255,0.03)", transition: "all 0.2s" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <MapPin size={16} color={map.accentColor} />
                  <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{map.namePt}</Typography>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#e74c3c22", border: "1px solid #e74c3c55", color: "#e74c3c", fontWeight: 700 }}>
                    EXTREMO
                  </span>
                </Box>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mt: 0.5 }}>{map.descPt}</Typography>
              </Box>
            ))}
          </Box>

          <Button onClick={() => selectedMap && onCreateChallenge(selectedMap)} disabled={!selectedMap} variant="contained" startIcon={<Swords size={16} />}
            sx={{ mt: 3, width: "100%", background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: 2, fontFamily: "monospace", py: 1.8, borderRadius: 2, textTransform: "none", boxShadow: "0 0 24px rgba(231,76,60,0.4)", opacity: selectedMap ? 1 : 0.4 }}>
            CRIAR DESAFIO
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 35%, rgba(42,16,80,0.98) 0%, rgba(14,5,32,0.99) 60%, rgba(8,2,20,0.99) 100%)", backdropFilter: "blur(16px)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Box sx={{ maxWidth: 500, width: "100%" }}>
        <Button onClick={onBack} startIcon={<ArrowLeft size={16} />} variant="outlined"
          sx={{ mb: 3, color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
          Voltar
        </Button>

        <Typography sx={{ fontSize: 20, fontWeight: 800, mb: 3, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Desafios de Amigos
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
          <Button onClick={() => setShowCreate(true)} variant="contained" startIcon={<Plus size={16} />}
            sx={{ flex: 1, background: "linear-gradient(135deg, #7b2ff7, #aa55ff)", color: "#fff", fontSize: 13, fontWeight: 700, py: 1.5, borderRadius: 2, textTransform: "none" }}>
            Criar Desafio
          </Button>
          <Button onClick={() => joinToken && onJoinChallenge(joinToken)} variant="outlined"
            sx={{ flex: 1, color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Aceitar
          </Button>
        </Box>

        <input
          value={joinToken}
          onChange={e => setJoinToken(e.target.value)}
          placeholder="Cola o link ou token do desafio..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, fontFamily: "monospace", marginBottom: 20, outline: "none" }}
        />

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace", mb: 2 }}>
          Desafios Ativos
        </Typography>

        {loading ? (
          <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, py: 4 }}>A carregar...</Typography>
        ) : challenges.length === 0 ? (
          <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, py: 4 }}>Nenhum desafio ativo.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxHeight: 300, overflowY: "auto" }}>
            {challenges.map(ch => (
              <Box key={ch.id} onClick={() => onJoinChallenge(ch.id)}
                sx={{ p: "12px 14px", borderRadius: 2, cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", transition: "all 0.2s", "&:hover": { background: "rgba(255,255,255,0.06)" } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Swords size={13} color="#aa55ff" />
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{ch.creator}</Typography>
                  <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>em {ch.mapName}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {ch.score > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Trophy size={11} color="#ffd700" />
                      <Typography sx={{ fontSize: 11, color: "#ffd700", fontWeight: 700 }}>{ch.score.toLocaleString()}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
                    <Clock size={11} color="rgba(255,255,255,0.3)" />
                    <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      {Math.max(0, Math.floor((ch.expiresAt - Date.now()) / (1000 * 60 * 60)))}h restante
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
