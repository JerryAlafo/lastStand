"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowLeft, Clock3, Flame } from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:640px)");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/events/active")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const active = !!data?.isActive;

  const formatDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("pt-PT", { 
      weekday: "short", 
      day: "2-digit", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const getEventImageUrl = (imageName: string) => {
    if (!imageName) return null;
    return `/${imageName}.jpeg`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: isMobile ? "18px 12px 24px" : "28px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.2, flexWrap: "wrap" }}>
          <Button onClick={() => router.push("/game")} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Flame size={24} color={active ? "#ff8c00" : "rgba(255,255,255,0.45)"} style={{ filter: active ? "drop-shadow(0 0 8px #ff8c0066)" : "none" }} />
            <Typography sx={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Eventos Temporários
            </Typography>
          </Box>
        </Box>

        <Box sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
          {data?.event?.image && (
            <Box sx={{ position: "relative", width: "100%", height: isMobile ? 260 : 380, overflow: "hidden" }}>
              <img 
                src={getEventImageUrl(data.event.image)} 
                alt={data.event.name}
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover",
                  objectPosition: "center 30%",
                  filter: active ? "brightness(1)" : "brightness(0.4)"
                }}
              />
              {!active && (
                <Box sx={{ 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.5)"
                }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                    Bloqueado
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          <Box sx={{ p: isMobile ? 1.5 : 2.5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1, color: "rgba(255,255,255,0.9)" }}>{data?.event?.name ?? "A carregar evento..."}</Typography>
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.45)", mb: 2 }}>{data?.event?.description ?? "..."}</Typography>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, color: "rgba(255,255,255,0.35)", fontSize: 12, mb: 1 }}>
              <Clock3 size={14} />
              <span style={{ lineHeight: 1.35 }}>
                {active ? "Ativo agora" : `Abre a ${formatDate(data?.eventStart)}`}
                {data?.eventEnd && ` · Termina a ${formatDate(data.eventEnd)}`}
              </span>
            </Box>
            <Button
              disabled={!active}
              onClick={() => router.push(`/game?event=1`)}
              variant="contained"
              startIcon={<Flame size={14} />}
              sx={{ 
                textTransform: "none", 
                fontWeight: 700, 
                background: active ? "linear-gradient(135deg, #7b2ff7, #aa55ff)" : "rgba(255,255,255,0.1)",
                color: active ? "#fff" : "rgba(255,255,255,0.3)",
                borderRadius: 2,
                opacity: active ? 1 : 0.5
              }}
            >
              Jogar Evento
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 2.5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "rgba(200,150,255,0.75)", textTransform: "uppercase" }}>
              Ranking do Evento
            </Typography>
          </Box>
          <Box sx={{ p: isMobile ? 1.2 : 2 }}>
            {!data?.leaderboard?.length ? (
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
                Sem scores de evento no momento.
              </Typography>
            ) : (
              data.leaderboard.slice(0, 5).map((r: { username: string; score: number }, i: number) => (
                <Box key={`${r.username}-${i}`} sx={{ display: "flex", alignItems: "center", gap: 1.2, py: 0.8 }}>
                  <Typography sx={{ width: 22, color: i < 3 ? "#ffd700" : "rgba(255,255,255,0.45)", fontWeight: 700 }}>{i + 1}</Typography>
                  <Box sx={{ width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)" }}>
                    {r.username.slice(0, 2).toUpperCase()}
                  </Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 13 : 14 }}>{r.username}</Typography>
                  <Typography sx={{ ml: "auto", color: "#ffd700", fontWeight: 700, fontSize: isMobile ? 12 : 13 }}>{r.score.toLocaleString()} pts</Typography>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </div>
  );
}
