"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { User, Lock, LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
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
      // Try new login API first
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const loginData = await loginRes.json();
      
      if (!loginRes.ok) {
        setError(loginData.error || "Username ou senha inválidos.");
        return;
      }

      // Now sign in with NextAuth using the returned user data
      const res = await signIn("credentials", { 
        username, 
        password, 
        redirect: false 
      });
      
      if (!res || res.error) { 
        setError("Username ou senha inválidos."); 
        return; 
      }
      router.push("/game");
    } catch (err) {
      setError("Ocorreu um erro. Tenta novamente.");
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
      "&.Mui-focused fieldset": { borderColor: "#7b2ff7", borderWidth: 2 },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.65)", fontSize: 15 },
    "& .MuiInputLabel-root.Mui-focused": { color: "#aa55ff" },
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
        autoComplete="current-password"
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
                  sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#aa55ff" } }}
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
        startIcon={loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <LogIn size={18} />}
        sx={{
          mt: 0.5, py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 16, letterSpacing: 1,
          background: "linear-gradient(135deg, #7b2ff7, #00c3ff)",
          boxShadow: "0 0 24px rgba(123,47,247,0.45)",
          textTransform: "none",
          "&:hover": { background: "linear-gradient(135deg, #9244ff, #22d4ff)", boxShadow: "0 0 32px rgba(123,47,247,0.65)" },
          "&:disabled": { opacity: 0.6 },
        }}
      >
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <Typography sx={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
        Não tem conta?{" "}
        <a href="/register" style={{ color: "#aa55ff", textDecoration: "none", fontWeight: 700 }}>
          Criar agora
        </a>
      </Typography>
    </Box>
  );
}
