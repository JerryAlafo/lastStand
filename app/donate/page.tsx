"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ArrowLeft, Heart, Copy, Check, ExternalLink, ChevronLeft } from "lucide-react";

const MPESA_NUMBER = "847240640";

const countries = [
  { code: "MZ", name: "Moçambique", mpesa: true },
  { code: "PT", name: "Portugal", mpesa: false },
  { code: "BR", name: "Brasil", mpesa: false },
  { code: "AO", name: "Angola", mpesa: false },
  { code: "ZA", name: "África do Sul", mpesa: false },
  { code: "US", name: "Estados Unidos", mpesa: false },
  { code: "GB", name: "Reino Unido", mpesa: false },
  { code: "FR", name: "França", mpesa: false },
  { code: "DE", name: "Alemanha", mpesa: false },
  { code: "CA", name: "Canadá", mpesa: false },
  { code: "AU", name: "Austrália", mpesa: false },
  { code: "OTHER", name: "Outro país", mpesa: false },
];

export default function DonatePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");

  const country = countries.find((c) => c.code === selected);

  function copyNumber() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(MPESA_NUMBER).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }

  return (
    <div style={{
      minHeight: "100vh", overflowY: "auto", overflowX: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      padding: "clamp(14px, 4vw, 24px) clamp(12px, 4vw, 20px) clamp(20px, 6vw, 40px)",
      background: "radial-gradient(ellipse at 50% 25%, #2a1050 0%, #160830 55%, #0e0520 100%)",
      color: "#fff", position: "relative",
    }}>
      {/* Glow blobs */}
      <div style={{ position: "absolute", top: "5%", left: "8%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "8%", right: "6%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,100,150,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ width: "100%", maxWidth: 500, position: "relative", zIndex: 1 }}>
        {/* Back */}
        <Button
          onClick={() => router.back()}
          startIcon={<ArrowLeft size={16} />}
          sx={{ mb: 3, color: "rgba(255,255,255,0.6)", textTransform: "none", borderRadius: 2, "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" } }}
        >
          Voltar
        </Button>

        {/* Header */}
        <Box sx={{ textAlign: "center", mb: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: { xs: 52, sm: 60 }, height: { xs: 52, sm: 60 }, borderRadius: "50%", background: "linear-gradient(135deg,#e74c3c,#ff6b9d)", boxShadow: "0 0 30px rgba(231,76,60,0.4)", mb: 2 }}>
            <Heart size={26} color="#fff" fill="#fff" />
          </Box>
          <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, background: "linear-gradient(135deg,#fff,#ffaacc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 0.5 }}>
            Apoiar o Projecto
          </Typography>
          <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            O teu apoio ajuda a manter e melhorar o Last Stand Arena
          </Typography>
        </Box>

        {/* Card */}
        <Box sx={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 4, p: { xs: "18px 14px", sm: "28px 28px" }, backdropFilter: "blur(20px)", boxShadow: "0 0 60px rgba(123,47,247,0.15), 0 12px 40px rgba(0,0,0,0.4)" }}>

          {/* Country selector */}
          <Typography sx={{ fontSize: 12, letterSpacing: 2.5, color: "rgba(200,150,255,0.75)", textTransform: "uppercase", mb: 1.5, fontFamily: "monospace" }}>
            Selecciona o teu país
          </Typography>
          <select
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
            style={{
              width: "100%", padding: "13px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)",
              color: selected ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 15,
              outline: "none", cursor: "pointer", fontFamily: "inherit",
              appearance: "none",
            }}
          >
            <option value="" style={{ background: "#1a0a3a" }}>— Escolher país —</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code} style={{ background: "#1a0a3a", color: "#fff" }}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Mozambique — M-Pesa */}
          {selected && country?.mpesa && (
            <Box sx={{ mt: 3 }}>
              <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(200,150,255,0.7)", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: "0 0 14px", fontWeight: 600 }}>
                <ChevronLeft size={15} /> Mudar país
              </button>
              {/* M-Pesa badge */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={{ px: 2, py: 0.6, background: "linear-gradient(135deg,#e30613,#ff4d00)", borderRadius: 2, fontSize: 14, fontWeight: 900, letterSpacing: 1, color: "#fff", boxShadow: "0 0 18px rgba(227,6,19,0.4)" }}>
                  M-PESA
                </Box>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Transferência directa</Typography>
              </Box>

              {/* Steps */}
              {[
                "Abre o M-Pesa no teu telemóvel",
                "Selecciona 'Enviar Dinheiro'",
                `Digita o número abaixo e o valor`,
                "Confirma com o teu PIN",
              ].map((step, i) => (
                <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "flex-start", mb: 1.5 }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(227,6,19,0.25)", border: "1px solid rgba(227,6,19,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#ff6644", flexShrink: 0, mt: 0.1 }}>
                    {i + 1}
                  </Box>
                  <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{step}</Typography>
                </Box>
              ))}

              {/* Number */}
              <Box sx={{ mt: 2.5, p: { xs: "14px 12px", sm: "16px 20px" }, background: "rgba(227,6,19,0.08)", border: "1px solid rgba(227,6,19,0.25)", borderRadius: 3, display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1.2, sm: 0 }, justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace", mb: 0.5 }}>Número M-Pesa</Typography>
                  <Typography sx={{ fontSize: { xs: 20, sm: 26 }, fontWeight: 900, letterSpacing: { xs: 1.5, sm: 3 }, color: "#fff", fontFamily: "monospace" }}>{MPESA_NUMBER}</Typography>
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mt: 0.3 }}>Jerry Alafo</Typography>
                </Box>
                <Button
                  onClick={copyNumber}
                  variant="contained"
                  startIcon={copied ? <Check size={15} /> : <Copy size={15} />}
                  sx={{
                    background: copied ? "rgba(46,204,113,0.85)" : "rgba(255,255,255,0.1)",
                    color: "#fff", fontWeight: 700, textTransform: "none", borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.15)", fontSize: 13,
                    alignSelf: { xs: "stretch", sm: "auto" },
                    "&:hover": { background: copied ? "rgba(46,204,113,0.95)" : "rgba(255,255,255,0.18)" },
                    transition: "all 0.2s",
                  }}
                >
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </Box>

              {/* Optional amount */}
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mb: 1 }}>Valor a enviar (opcional — qualquer valor é bem-vindo!)</Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {["50 MT", "100 MT", "200 MT", "500 MT"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(amount === v ? "" : v)}
                      style={{
                        padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                        background: amount === v ? "rgba(227,6,19,0.3)" : "rgba(255,255,255,0.06)",
                        border: amount === v ? "1px solid rgba(227,6,19,0.6)" : "1px solid rgba(255,255,255,0.12)",
                        color: "#fff", transition: "all 0.15s",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 2.5, p: "12px 16px", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 3 }}>
                <Typography sx={{ fontSize: 13, color: "rgba(100,220,120,0.9)", lineHeight: 1.6 }}>
                  Após o pagamento não é necessária confirmação. Obrigado pelo apoio!
                </Typography>
              </Box>
            </Box>
          )}

          {/* Other country */}
          {selected && !country?.mpesa && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(200,150,255,0.7)", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: "0 0 14px", fontWeight: 600 }}>
                <ChevronLeft size={15} /> Mudar país
              </button>
              <Box sx={{ mb: 2.5, p: "20px", background: "rgba(123,47,247,0.08)", border: "1px solid rgba(123,47,247,0.2)", borderRadius: 3 }}>
                <Typography sx={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, mb: 1 }}>
                  Para doações internacionais, entra em contacto directamente para combinarmos o método de pagamento mais conveniente para ti.
                </Typography>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  Respondo o mais rápido possível!
                </Typography>
              </Box>
              <Button
                onClick={() => router.push("/contact")}
                variant="contained"
                endIcon={<ExternalLink size={16} />}
                fullWidth
                sx={{
                  py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 15, textTransform: "none",
                  background: "linear-gradient(135deg,#7b2ff7,#00c3ff)",
                  boxShadow: "0 0 24px rgba(123,47,247,0.4)",
                  "&:hover": { background: "linear-gradient(135deg,#9244ff,#22d4ff)" },
                }}
              >
                Contactar Jerry Alafo
              </Button>
            </Box>
          )}

          {/* No selection */}
          {!selected && (
            <Box sx={{ mt: 3, textAlign: "center", py: 2 }}>
              <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
                Selecciona o teu país para ver as opções de doação disponíveis
              </Typography>
            </Box>
          )}
        </Box>

        <Typography sx={{ mt: 2.5, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          Last Stand Arena · Criado por Jerry Alafo · Toda a doação é voluntária
        </Typography>
      </Box>
    </div>
  );
}
