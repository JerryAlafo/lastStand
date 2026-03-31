"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ArrowLeft, Mail, MessageCircle, ExternalLink } from "lucide-react";

function IgIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const contacts = [
  {
    label: "Email",
    value: "jerryalafo20@gmail.com",
    icon: <Mail size={22} />,
    href: "mailto:jerryalafo20@gmail.com",
    color: "#ea4335",
    glow: "rgba(234,67,53,0.3)",
    description: "Envia-me um email directamente",
  },
  {
    label: "WhatsApp",
    value: "+258 833 066 530",
    icon: <MessageCircle size={22} />,
    href: "https://wa.me/258833066530",
    color: "#25d366",
    glow: "rgba(37,211,102,0.3)",
    description: "Fala comigo no WhatsApp",
  },
  {
    label: "Instagram",
    value: "@jerry_org_",
    icon: <IgIcon size={22} />,
    href: "https://www.instagram.com/jerry_org_/",
    color: "#e1306c",
    glow: "rgba(225,48,108,0.3)",
    description: "Perfil pessoal",
  },
  {
    label: "Instagram",
    value: "@jerry_org_jobs",
    icon: <IgIcon size={22} />,
    href: "https://www.instagram.com/jerry_org_jobs/",
    color: "#c13584",
    glow: "rgba(193,53,132,0.3)",
    description: "Perfil profissional / trabalhos",
  },
];

export default function ContactPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)",
        color: "#fff",
        padding: "32px 20px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Decorative glows */}
      <div
        style={{
          position: "fixed",
          top: "8%",
          left: "12%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(123,47,247,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "12%",
          right: "10%",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,195,255,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ maxWidth: 520, mx: "auto", position: "relative", zIndex: 1 }}>
        {/* Back button */}
        <Button
          onClick={() => router.back()}
          startIcon={<ArrowLeft size={16} />}
          variant="outlined"
          sx={{
            mb: 4,
            color: "rgba(255,255,255,0.6)",
            borderColor: "rgba(255,255,255,0.12)",
            borderRadius: 2,
            textTransform: "none",
            "&:hover": {
              borderColor: "rgba(255,255,255,0.3)",
              bgcolor: "rgba(255,255,255,0.04)",
            },
          }}
        >
          Voltar
        </Button>

        {/* Header card */}
        <Box
          sx={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            p: "32px 28px",
            mb: 3,
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 0 60px rgba(123,47,247,0.12), 0 8px 32px rgba(0,0,0,0.4)",
            textAlign: "center",
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              mx: "auto",
              mb: 2.5,
              background: "linear-gradient(135deg, #7b2ff7, #00c3ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              boxShadow: "0 0 30px rgba(123,47,247,0.5)",
            }}
          >
            JA
          </Box>

          <Typography
            sx={{ fontSize: 24, fontWeight: 800, letterSpacing: 0.5, mb: 0.5 }}
          >
            Jerry Alafo
          </Typography>
          <Typography
            sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)", mb: 1.5 }}
          >
            Criador · Last Stand Arena
          </Typography>
          <Box
            sx={{
              display: "inline-block",
              px: 2,
              py: 0.5,
              background: "rgba(123,47,247,0.15)",
              border: "1px solid rgba(123,47,247,0.3)",
              borderRadius: 10,
              fontSize: 11,
              color: "#aa66ff",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Engenheiro · Desenvolvedor
          </Box>
        </Box>

        {/* Contact cards */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {contacts.map((c, i) => (
            <a
              key={i}
              href={c.href}
              target={c.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 3,
                  p: "16px 20px",
                  backdropFilter: "blur(8px)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${c.color}44`,
                    boxShadow: `0 0 20px ${c.glow}`,
                    transform: "translateX(4px)",
                  },
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2.5,
                    background: `${c.color}18`,
                    border: `1px solid ${c.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.color,
                    flexShrink: 0,
                  }}
                >
                  {c.icon}
                </Box>

                {/* Text */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      mb: 0.3,
                    }}
                  >
                    {c.label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 15, fontWeight: 700, color: "#fff" }}
                  >
                    {c.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      mt: 0.2,
                    }}
                  >
                    {c.description}
                  </Typography>
                </Box>

                <ExternalLink
                  size={16}
                  color="rgba(255,255,255,0.25)"
                  style={{ flexShrink: 0 }}
                />
              </Box>
            </a>
          ))}
        </Box>

        <Typography
          sx={{
            mt: 4,
            textAlign: "center",
            fontSize: 12,
            color: "rgba(255,255,255,0.18)",
          }}
        >
          Last Stand Arena © 2025 · Jerry Alafo
        </Typography>
      </Box>
    </div>
  );
}
