"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Copy, Check, Users, Swords, Play, ArrowLeft } from "lucide-react";
import type { Room } from "@/lib/fileStore";

function LobbyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const roomId = params.get("room") ?? "";
  const mode = (params.get("mode") ?? "coop") as "pvp" | "coop";
  const role = (params.get("role") ?? "host") as "host" | "guest";

  const [room, setRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/multiplayer/join/${roomId}`
    : "";

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { room: Room };
      setRoom(data.room);
      // Redirect both host and guest when the game starts
      if (data.room.status === "playing") {
        clearInterval(pollRef.current);
        router.push(`/game?room=${roomId}&role=${role}&mode=${mode}`);
      }
    } catch { /* ignore */ }
  }, [roomId, mode, role, router]);

  useEffect(() => {
    fetchRoom();
    pollRef.current = setInterval(fetchRoom, 2000);
    return () => clearInterval(pollRef.current);
  }, [fetchRoom]);

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl).catch(() => {
      // fallback: prompt
      window.prompt("Copia este link:", inviteUrl);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: "Last Stand Arena — Multiplayer", text: "Entra na minha sala!", url: inviteUrl }).catch(() => undefined);
    } else {
      copyLink();
    }
  }

  async function startGame() {
    if (!room?.guest) { setError("Aguarda o convidado entrar na sala."); return; }
    setStarting(true);
    setError(null);
    const res = await fetch(`/api/rooms/${roomId}/start`, { method: "POST" });
    if (!res.ok) {
      const d = (await res.json()) as { error?: string };
      setError(d.error ?? "Erro ao iniciar.");
      setStarting(false);
      return;
    }
    router.push(`/game?room=${roomId}&role=host&mode=${mode}`);
  }

  const modeLabel = mode === "pvp" ? "PVP — Tu vs. Adversário" : "Co-op — Juntos contra inimigos";
  const modeColor = mode === "pvp" ? "#e74c3c" : "#2ecc71";
  const ModeIcon = mode === "pvp" ? Swords : Users;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 25%, #2a1050 0%, #0e0520 60%, #08021a 100%)",
      color: "#fff", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "32px 20px",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <div style={{ position: "fixed", top: "8%", right: "8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.16) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1 }}>
        <Button onClick={() => router.push("/multiplayer")} startIcon={<ArrowLeft size={14} />} variant="outlined"
          sx={{ mb: 3, color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "rgba(255,255,255,0.25)", bgcolor: "rgba(255,255,255,0.04)" } }}>
          Voltar
        </Button>

        {/* Mode badge */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, p: "8px 16px", borderRadius: 20, border: `1px solid ${modeColor}44`, background: `${modeColor}11`, width: "fit-content" }}>
          <ModeIcon size={14} color={modeColor} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: modeColor, letterSpacing: 0.5 }}>{modeLabel}</Typography>
        </Box>

        {/* Room card */}
        <Box sx={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: 3, backdropFilter: "blur(16px)", mb: 3 }}>
          <Typography sx={{ fontSize: 11, letterSpacing: 3, color: "rgba(200,150,255,0.6)", textTransform: "uppercase", fontFamily: "monospace", mb: 2 }}>
            Sala de Espera
          </Typography>

          {/* Players */}
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {/* Host */}
            <Box sx={{ flex: 1, p: 2, background: "rgba(123,47,247,0.12)", border: "1px solid rgba(123,47,247,0.3)", borderRadius: 2, textAlign: "center" }}>
              <Typography sx={{ fontSize: 10, letterSpacing: 2, color: "rgba(170,102,255,0.7)", textTransform: "uppercase", mb: 1 }}>Criador</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#cc88ff" }}>
                {session?.user?.username ?? "…"}
              </Typography>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71", mx: "auto", mt: 1 }} />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.2)", fontSize: 18, fontWeight: 300 }}>VS</Box>

            {/* Guest */}
            <Box sx={{ flex: 1, p: 2, background: room?.guest ? "rgba(46,204,113,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${room?.guest ? "rgba(46,204,113,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 2, textAlign: "center" }}>
              <Typography sx={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", mb: 1 }}>Convidado</Typography>
              {room?.guest ? (
                <>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#2ecc71" }}>{room.guest}</Typography>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71", mx: "auto", mt: 1 }} />
                </>
              ) : (
                <>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>A aguardar…</Typography>
                  <CircularProgress size={10} sx={{ color: "rgba(255,255,255,0.2)", mt: 0.8 }} />
                </>
              )}
            </Box>
          </Box>

          {/* Invite link — only shown to host */}
          {role === "host" && (
            <>
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mb: 1, letterSpacing: 0.5 }}>Link de convite</Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box sx={{ flex: 1, p: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "monospace" }}>
                    {inviteUrl}
                  </Typography>
                </Box>
                <Button onClick={copyLink} variant="outlined" sx={{ minWidth: 44, px: 1.5, py: 1.2, borderColor: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 2, "&:hover": { borderColor: "rgba(255,255,255,0.3)", bgcolor: "rgba(255,255,255,0.05)" } }}>
                  {copied ? <Check size={16} color="#2ecc71" /> : <Copy size={16} />}
                </Button>
              </Box>

              <Button onClick={shareLink} fullWidth variant="outlined" sx={{ mt: 1.5, borderColor: "rgba(123,47,247,0.35)", color: "rgba(200,150,255,0.8)", borderRadius: 2, textTransform: "none", fontSize: 13, py: 1, "&:hover": { borderColor: "rgba(123,47,247,0.6)", bgcolor: "rgba(123,47,247,0.08)" } }}>
                Partilhar no WhatsApp / link
              </Button>
            </>
          )}
        </Box>

        {error && <Typography sx={{ fontSize: 13, color: "#e74c3c", textAlign: "center", mb: 2 }}>{error}</Typography>}

        {role === "host" ? (
          <Button
            onClick={startGame}
            disabled={!room?.guest || starting}
            variant="contained"
            fullWidth
            startIcon={starting ? undefined : <Play size={17} />}
            sx={{
              background: room?.guest ? "linear-gradient(135deg,#2ecc71,#1abc9c)" : "rgba(255,255,255,0.08)",
              color: "#fff", fontWeight: 800, fontSize: 16, py: 1.9, borderRadius: 3,
              textTransform: "none", boxShadow: room?.guest ? "0 0 28px rgba(46,204,113,0.4)" : "none",
              "&:hover": { background: room?.guest ? "linear-gradient(135deg,#27ae60,#16a085)" : undefined },
              "&:disabled": { color: "rgba(255,255,255,0.3)" },
            }}
          >
            {starting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : room?.guest ? "Iniciar Partida" : "Aguardando convidado…"}
          </Button>
        ) : (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 1 }}>
              <CircularProgress size={16} sx={{ color: "rgba(170,102,255,0.7)" }} />
              <Typography sx={{ fontSize: 14, color: "rgba(200,150,255,0.8)", fontWeight: 600 }}>
                A aguardar que o anfitrião inicie…
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>
              O jogo começará automaticamente
            </Typography>
          </Box>
        )}
      </Box>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense>
      <LobbyContent />
    </Suspense>
  );
}
