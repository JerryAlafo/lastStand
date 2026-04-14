"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ArrowLeft, Clock3, Flame } from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
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

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: "28px 20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button onClick={() => router.push("/game")} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none" }}>
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Flame size={24} color={active ? "#ff8c00" : "rgba(255,255,255,0.45)"} style={{ filter: active ? "drop-shadow(0 0 8px #ff8c0066)" : "none" }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Eventos Temporários
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1, color: "rgba(255,255,255,0.9)" }}>{data?.event?.name ?? "A carregar evento..."}</Typography>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.45)", mb: 2 }}>{data?.event?.description ?? "..."}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.35)", fontSize: 12, mb: 1 }}>
            <Clock3 size={14} />
            {active ? "Ativo agora" : `Abre a ${formatDate(data?.eventStart)}`}
            {data?.eventEnd && ` · Termina a ${formatDate(data.eventEnd)}`}
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
    </div>
  );
}
