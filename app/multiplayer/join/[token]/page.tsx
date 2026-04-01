"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { Swords, Users, LogIn, UserPlus, Play } from "lucide-react";
import type { Room } from "@/lib/fileStore";

type AuthTab = "login" | "register";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 2,
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(123,47,247,0.5)" },
    "&.Mui-focused fieldset": { borderColor: "#7b2ff7" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#aa55ff" },
};

export default function JoinPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { data: session, status } = useSession();

  const [room, setRoom] = useState<Room | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Auth form state
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${token}`);
      if (!res.ok) { setRoomError("Sala não encontrada ou link inválido."); return; }
      const data = (await res.json()) as { room: Room };
      setRoom(data.room);
    } catch { setRoomError("Erro ao carregar sala."); }
  }, [token]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  // If user is already logged in and room is loaded → auto-join
  const joinRoom = useCallback(async () => {
    if (!room || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/rooms/${token}/join`, { method: "POST" });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setJoinError(d.error ?? "Erro ao entrar na sala.");
        setJoining(false);
        return;
      }
      const { role } = (await res.json()) as { role: "host" | "guest" };
      if (role === "guest") {
        // Guest waits in lobby until host starts the game
        router.push(`/multiplayer/lobby?room=${token}&mode=${room.mode ?? "coop"}&role=guest`);
      } else {
        // Host re-entering their own room goes straight to game
        router.push(`/game?room=${token}&role=host&mode=${room.mode ?? "coop"}`);
      }
    } catch {
      setJoinError("Erro de conexão.");
      setJoining(false);
    }
  }, [room, token, joining, router]);

  // Auth handlers
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const res = await signIn("credentials", { username, password, redirect: false });
    if (!res || res.error) {
      setAuthError("Username ou senha inválidos.");
      setAuthLoading(false);
      return;
    }
    // Session will update → effect will trigger join
    setAuthLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      setAuthError(d?.error ?? "Falha ao registrar.");
      setAuthLoading(false);
      return;
    }
    // Auto-login after register
    const login = await signIn("credentials", { username, password, redirect: false });
    if (!login || login.error) {
      setAuthError("Conta criada! Faz login manualmente.");
      setAuthTab("login");
    }
    setAuthLoading(false);
  }

  const modeLabel = room?.mode === "pvp" ? "PVP — Tu vs. Adversário" : "Co-op — Juntos contra inimigos";
  const modeColor = room?.mode === "pvp" ? "#e74c3c" : "#2ecc71";
  const ModeIcon = room?.mode === "pvp" ? Swords : Users;

  if (roomError) {
    return (
      <div style={{ minHeight: "100vh", background: "#08021a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center", p: 4 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#e74c3c", mb: 1 }}>Link inválido</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.4)", mb: 3 }}>{roomError}</Typography>
          <Button onClick={() => router.push("/game")} variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)", borderRadius: 2, textTransform: "none" }}>
            Ir para o jogo
          </Button>
        </Box>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 25%, #2a1050 0%, #0e0520 60%, #08021a 100%)",
      color: "#fff", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "32px 20px",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <div style={{ position: "fixed", top: "6%", left: "6%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Room info card */}
        {room && (
          <Box sx={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: 3, backdropFilter: "blur(16px)", mb: 3 }}>
            <Typography sx={{ fontSize: 11, letterSpacing: 3, color: "rgba(200,150,255,0.6)", textTransform: "uppercase", fontFamily: "monospace", mb: 2 }}>
              Convite para jogar
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, p: "6px 14px", borderRadius: 20, border: `1px solid ${modeColor}44`, background: `${modeColor}11`, width: "fit-content" }}>
              <ModeIcon size={13} color={modeColor} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: modeColor }}>{modeLabel}</Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box sx={{ p: "12px 18px", background: "rgba(123,47,247,0.12)", border: "1px solid rgba(123,47,247,0.3)", borderRadius: 2, textAlign: "center", flex: 1 }}>
                <Typography sx={{ fontSize: 10, letterSpacing: 2, color: "rgba(200,150,255,0.75)", textTransform: "uppercase", mb: 0.5 }}>Criador</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 900, color: "#aa55ff" }}>{room.host}</Typography>
              </Box>
              <Typography sx={{ color: "rgba(255,255,255,0.25)", fontWeight: 300 }}>vs</Typography>
              <Box sx={{ p: "12px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, textAlign: "center", flex: 1 }}>
                <Typography sx={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", mb: 0.5 }}>Tu</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 900, color: session?.user?.username ? "#2ecc71" : "rgba(255,255,255,0.3)" }}>
                  {session?.user?.username ?? "—"}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {!room && !roomError && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#7b2ff7" }} />
          </Box>
        )}

        {/* Authenticated — show join button */}
        {status === "authenticated" && room && (
          <>
            {joinError && <Alert severity="error" sx={{ mb: 2, bgcolor: "rgba(231,76,60,0.12)", color: "#ff8888", "& .MuiAlert-icon": { color: "#e74c3c" } }}>{joinError}</Alert>}
            <Button
              onClick={joinRoom}
              disabled={joining || room.status !== "waiting"}
              variant="contained"
              fullWidth
              startIcon={joining ? undefined : <Play size={17} />}
              sx={{
                background: room.status === "waiting" ? "linear-gradient(135deg,#7b2ff7,#aa55ff)" : "rgba(255,255,255,0.08)",
                color: "#fff", fontWeight: 800, fontSize: 15, py: 1.9, borderRadius: 3,
                textTransform: "none",
                boxShadow: room.status === "waiting" ? "0 0 28px rgba(123,47,247,0.4)" : "none",
                "&:hover": { background: "linear-gradient(135deg,#6a25e0,#9944ee)" },
              }}
            >
              {joining ? <CircularProgress size={20} sx={{ color: "#fff" }} /> :
                room.status !== "waiting" ? "Partida já iniciada" :
                room.host === session?.user?.username ? "Voltar à Sala" :
                "Entrar na Partida"}
            </Button>
          </>
        )}

        {/* Not authenticated — show login/register inline */}
        {status === "unauthenticated" && room && (
          <Box sx={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, p: 3, backdropFilter: "blur(16px)" }}>
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", mb: 2, textAlign: "center" }}>
              Para entrar na sala, precisas de uma conta.
            </Typography>

            {/* Tabs */}
            <Box sx={{ display: "flex", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", mb: 3 }}>
              {(["login", "register"] as AuthTab[]).map(tab => (
                <Box
                  key={tab}
                  onClick={() => { setAuthTab(tab); setAuthError(null); }}
                  sx={{
                    flex: 1, py: 1.2, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700,
                    background: authTab === tab ? "rgba(123,47,247,0.35)" : "transparent",
                    color: authTab === tab ? "#aa55ff" : "rgba(255,255,255,0.4)",
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8,
                  }}
                >
                  {tab === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
                  {tab === "login" ? "Já tenho conta" : "Criar conta"}
                </Box>
              ))}
            </Box>

            <Box component="form" onSubmit={authTab === "login" ? handleLogin : handleRegister} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} required fullWidth size="small" sx={fieldSx} />
              <TextField label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth size="small" sx={fieldSx} />
              {authError && <Alert severity="error" sx={{ bgcolor: "rgba(231,76,60,0.1)", color: "#ff8888", "& .MuiAlert-icon": { color: "#e74c3c" }, py: 0.5 }}>{authError}</Alert>}
              <Button type="submit" variant="contained" fullWidth disabled={authLoading}
                sx={{ background: "linear-gradient(135deg,#7b2ff7,#aa55ff)", color: "#fff", fontWeight: 700, py: 1.4, borderRadius: 2, textTransform: "none", "&:hover": { background: "linear-gradient(135deg,#6a25e0,#9944ee)" } }}>
                {authLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : authTab === "login" ? "Entrar e Juntar-se" : "Criar e Juntar-se"}
              </Button>
            </Box>
          </Box>
        )}

        {status === "loading" && (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <CircularProgress sx={{ color: "#7b2ff7" }} size={24} />
          </Box>
        )}
      </Box>
    </div>
  );
}
