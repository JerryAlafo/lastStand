"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Swords, Users, ArrowLeft, ChevronRight } from "lucide-react";

const glassCard = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 16,
  backdropFilter: "blur(16px)",
  padding: "28px 30px",
  cursor: "pointer",
  transition: "all 0.18s",
};

export default function MultiplayerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selected, setSelected] = useState<"pvp" | "coop" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms/create", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao criar sala.");
      const { roomId } = (await res.json()) as { roomId: string };

      // Set mode immediately
      await fetch(`/api/rooms/${roomId}/mode`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: selected }),
      });

      router.push(`/multiplayer/lobby?room=${roomId}&mode=${selected}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
      setLoading(false);
    }
  }

  const modes = [
    {
      key: "pvp" as const,
      icon: <Swords size={32} color="#e74c3c" />,
      title: "PVP",
      desc: "Tu vs. Adversário",
      detail: "Sem inimigos — apenas dois jogadores a combaterem-se na arena.",
      borderColor: "rgba(231,76,60,0.35)",
      glowColor: "rgba(231,76,60,0.15)",
      activeColor: "rgba(231,76,60,0.25)",
    },
    {
      key: "coop" as const,
      icon: <Users size={32} color="#2ecc71" />,
      title: "Co-op",
      desc: "Juntos contra inimigos",
      detail: "Dois jogadores cooperam para sobreviver às waves de inimigos.",
      borderColor: "rgba(46,204,113,0.35)",
      glowColor: "rgba(46,204,113,0.12)",
      activeColor: "rgba(46,204,113,0.2)",
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 25%, #2a1050 0%, #0e0520 60%, #08021a 100%)",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* Glow blobs */}
      <div style={{ position: "fixed", top: "8%", left: "8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ width: "100%", maxWidth: 500, position: "relative", zIndex: 1 }}>
        {/* Back */}
        <Button
          onClick={() => router.push("/game")}
          startIcon={<ArrowLeft size={15} />}
          variant="outlined"
          sx={{ mb: 4, color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "rgba(255,255,255,0.3)", bgcolor: "rgba(255,255,255,0.04)" } }}
        >
          Voltar
        </Button>

        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography sx={{ fontSize: 11, letterSpacing: 4, color: "rgba(200,150,255,0.75)", textTransform: "uppercase", fontFamily: "monospace", mb: 1 }}>
            Modo Multiplayer
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg,#fff,#aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Escolhe o modo
          </Typography>
          {session?.user?.username && (
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.35)", mt: 1 }}>
              A jogar como <span style={{ color: "#aa55ff", fontWeight: 700 }}>{session.user.username}</span>
            </Typography>
          )}
        </Box>

        {/* Mode cards */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          {modes.map(m => (
            <Box
              key={m.key}
              onClick={() => setSelected(m.key)}
              sx={{
                ...glassCard,
                border: `1px solid ${selected === m.key ? m.borderColor : "rgba(255,255,255,0.08)"}`,
                background: selected === m.key ? m.activeColor : "rgba(255,255,255,0.04)",
                boxShadow: selected === m.key ? `0 0 30px ${m.glowColor}` : "none",
                display: "flex", alignItems: "center", gap: 2.5,
                "&:hover": { background: selected === m.key ? m.activeColor : "rgba(255,255,255,0.07)" },
              }}
            >
              <Box sx={{ flexShrink: 0 }}>{m.icon}</Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#fff", mb: 0.3 }}>{m.title} — {m.desc}</Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{m.detail}</Typography>
              </Box>
              {selected === m.key && <ChevronRight size={18} color="rgba(200,150,255,0.7)" />}
            </Box>
          ))}
        </Box>

        {error && (
          <Typography sx={{ fontSize: 13, color: "#e74c3c", textAlign: "center", mb: 2 }}>{error}</Typography>
        )}

        <Button
          onClick={createRoom}
          disabled={!selected || loading}
          variant="contained"
          fullWidth
          sx={{
            background: selected ? "linear-gradient(135deg,#7b2ff7,#aa55ff)" : "rgba(255,255,255,0.1)",
            color: "#fff", fontWeight: 800, fontSize: 15, py: 1.8, borderRadius: 3,
            textTransform: "none", letterSpacing: 0.5,
            boxShadow: selected ? "0 0 30px rgba(123,47,247,0.45)" : "none",
            "&:hover": { background: selected ? "linear-gradient(135deg,#6a25e0,#9944ee)" : undefined },
            "&:disabled": { color: "rgba(255,255,255,0.3)" },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Criar Sala e Convidar"}
        </Button>
      </Box>
    </div>
  );
}
