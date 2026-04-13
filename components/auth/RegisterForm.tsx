"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { User, Lock, UserPlus, Eye, EyeOff } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    const scriptId = "cf-turnstile-script";
    const containerId = "turnstile-register-container";
    let resizeHandler: (() => void) | null = null;

    const mountWidget = () => {
      if (!window.turnstile) return;
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = "";
      window.turnstile.render(container, {
        sitekey: siteKey,
        theme: "dark",
        size: "normal",
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(null),
        "error-callback": () => setCaptchaToken(null),
      });
      const widgetWrapper = container.firstElementChild as HTMLElement | null;
      if (widgetWrapper) {
        const baseWidth = 300;
        const baseHeight = 65;
        const applyScale = () => {
          const availableWidth = container.clientWidth;
          const rawScale = availableWidth / baseWidth;
          const isDesktop = window.matchMedia("(min-width: 900px)").matches;
          const scale = isDesktop ? Math.min(rawScale, 1.45) : Math.min(rawScale, 1);
          widgetWrapper.style.width = `${baseWidth}px`;
          widgetWrapper.style.maxWidth = `${baseWidth}px`;
          widgetWrapper.style.transform = `scale(${scale})`;
          widgetWrapper.style.transformOrigin = "top center";
          container.style.minHeight = `${Math.ceil(baseHeight * scale)}px`;
        };
        applyScale();
        if (resizeHandler) window.removeEventListener("resize", resizeHandler);
        resizeHandler = applyScale;
        window.addEventListener("resize", applyScale);
      }
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        mountWidget();
      } else {
        existing.addEventListener("load", mountWidget, { once: true });
      }
      return () => {
        existing.removeEventListener("load", mountWidget);
        if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = mountWidget;
    document.head.appendChild(script);
    return () => {
      script.removeEventListener("load", mountWidget);
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    };
  }, [siteKey]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!captchaToken) {
      setError("Valide o checkbox de segurança antes de criar conta.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, captchaToken }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? "Falha ao registrar.");
        return;
      }
      const loginRes = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!loginRes || loginRes.error) {
        router.push("/login");
        return;
      }

      router.push("/game");
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

      {siteKey ? (
        <Box
          id="turnstile-register-container"
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            minHeight: 66,
            "& > div": { display: "block", margin: "0 auto" },
          }}
        />
      ) : (
        <Alert severity="warning" sx={{ backgroundColor: "rgba(255,180,0,0.1)", color: "#ffd27a", border: "1px solid rgba(255,180,0,0.25)", fontSize: 14 }}>
          Turnstile não configurado. Defina NEXT_PUBLIC_TURNSTILE_SITE_KEY.
        </Alert>
      )}

      <Button
        type="submit"
        disabled={loading || !captchaToken}
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
        <a href="/login" style={{ color: "#aa55ff", textDecoration: "none", fontWeight: 700 }}>
          Entrar
        </a>
      </Typography>
    </Box>
  );
}
