"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { User, Lock, UserPlus, Eye, EyeOff } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? "Falha ao registrar.");
        return;
      }
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 2,
      fontSize: 15,
      "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
      "&:hover fieldset": { borderColor: "rgba(180,140,255,0.65)" },
      "&.Mui-focused fieldset": { borderColor: "#bb66ff", borderWidth: 2 },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.65)", fontSize: 15 },
    "& .MuiInputLabel-root.Mui-focused": { color: "#cc88ff" },
    "& .MuiInputAdornment-root svg": { color: "rgba(255,255,255,0.55)" },
  };

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        placeholder="seu_username"
        fullWidth
        sx={fieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><User size={18} /></InputAdornment>
            ),
          },
        }}
      />

      <TextField
        label="Senha"
        type={showPw ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="••••••••"
        fullWidth
        sx={fieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><Lock size={18} /></InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPw((v) => !v)}
                  edge="end"
                  size="small"
                  sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#cc88ff" } }}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {error && (
        <Alert severity="error" sx={{ backgroundColor: "rgba(255,80,80,0.1)", color: "#ffaaaa", border: "1px solid rgba(255,80,80,0.3)", fontSize: 14, "& .MuiAlert-icon": { color: "#ff7070" } }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        disabled={loading}
        fullWidth
        variant="contained"
        startIcon={loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <UserPlus size={18} />}
        sx={{
          mt: 0.5, py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 16, letterSpacing: 1,
          background: "linear-gradient(135deg, #7b2ff7, #00c3ff)",
          boxShadow: "0 0 24px rgba(123,47,247,0.45)",
          textTransform: "none",
          "&:hover": { background: "linear-gradient(135deg, #9244ff, #22d4ff)", boxShadow: "0 0 32px rgba(123,47,247,0.65)" },
          "&:disabled": { opacity: 0.6 },
        }}
      >
        {loading ? "Criando..." : "Criar conta"}
      </Button>

      <Typography sx={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
        Já tem conta?{" "}
        <a href="/login" style={{ color: "#cc88ff", textDecoration: "none", fontWeight: 700 }}>
          Entrar
        </a>
      </Typography>
    </Box>
  );
}
