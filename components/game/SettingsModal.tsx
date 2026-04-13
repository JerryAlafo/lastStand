"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  X,
  UserCog,
  Phone,
  Mail,
  MessageCircle,
  Camera,
  Briefcase,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { signOut } from "next-auth/react";

type Cfg = { skin: string; shirt: string; shorts: string; shoe: string };

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: color,
        border: active
          ? "2.5px solid #fff"
          : "2px solid rgba(255,255,255,0.15)",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        boxShadow: active ? `0 0 10px ${color}` : "none",
        transform: active ? "scale(1.18)" : "scale(1)",
        transition: "all 0.15s",
      }}
    />
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 2,
          color: "rgba(200,150,255,0.75)",
          textTransform: "uppercase",
          marginBottom: 7,
          fontFamily: "monospace",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}

function CharacterPreview({
  skin,
  shirt,
  shorts,
  shoe,
}: {
  skin: string;
  shirt: string;
  shorts: string;
  shoe: string;
}) {
  return (
    <svg
      width="100"
      height="200"
      viewBox="0 0 100 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.5))" }}
    >
      {/* Shadow */}
      <ellipse cx="50" cy="193" rx="26" ry="6" fill="rgba(0,0,0,0.22)" />
      {/* Legs */}
      <rect x="27" y="122" width="18" height="52" rx="7" fill={skin} />
      <rect x="55" y="122" width="18" height="52" rx="7" fill={skin} />
      {/* Shoes */}
      <ellipse cx="36" cy="176" rx="16" ry="8" fill={shoe} />
      <ellipse cx="64" cy="176" rx="16" ry="8" fill={shoe} />
      {/* Shorts */}
      <rect x="23" y="96" width="54" height="32" rx="7" fill={shorts} />
      {/* Torso */}
      <rect x="25" y="52" width="50" height="50" rx="9" fill={shirt} />
      {/* Arms */}
      <rect x="6" y="54" width="19" height="42" rx="8" fill={shirt} />
      <rect x="75" y="54" width="19" height="42" rx="8" fill={shirt} />
      {/* Hands */}
      <ellipse cx="15" cy="99" rx="9" ry="8" fill={skin} />
      <ellipse cx="85" cy="99" rx="9" ry="8" fill={skin} />
      {/* Neck */}
      <rect x="42" y="40" width="16" height="16" rx="5" fill={skin} />
      {/* Head */}
      <circle cx="50" cy="26" r="26" fill={skin} />
      {/* Eyes */}
      <circle cx="40" cy="23" r="5" fill="white" />
      <circle cx="60" cy="23" r="5" fill="white" />
      <circle cx="41" cy="24" r="2.8" fill="#1a1a2e" />
      <circle cx="61" cy="24" r="2.8" fill="#1a1a2e" />
      {/* Smile */}
      <path
        d="M40 38 Q50 45 60 38"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function SettingsModal({
  open,
  onClose,
  cfg,
  onSave,
  username,
}: {
  open: boolean;
  onClose: () => void;
  cfg: Cfg;
  onSave: (next: Cfg) => void;
  username: string;
}) {
  const [showContact, setShowContact] = useState(false);
  const [compact, setCompact] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameMsg, setRenameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth <= 420 || window.innerHeight <= 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!open) return null;

  if (showContact) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,10,0.85)",
          backdropFilter: "blur(8px)",
          padding: compact ? "12px" : "20px",
        }}
      >
        <div
          style={{
            width: 480,
            maxWidth: "92vw",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "rgba(12,4,28,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: compact ? "18px 16px" : "26px 28px",
            boxShadow: "0 0 80px rgba(123,47,247,0.3)",
            fontFamily: "'Inter','Segoe UI',sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Phone size={18} color="#aa55ff" />
              <span style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>
                Contacto
              </span>
            </div>
            <button
              onClick={() => {
                setShowContact(false);
                onClose();
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.45)",
                padding: 4,
                display: "flex",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Creator card */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 22,
              padding: "18px 0",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#7b2ff7,#00c3ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                margin: "0 auto 12px",
                boxShadow: "0 0 24px rgba(123,47,247,0.5)",
              }}
            >
              JA
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 0.5,
              }}
            >
              Jerry Alafo
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                marginTop: 4,
              }}
            >
              Criador · Last Stand Arena
            </div>
          </div>

          {/* Contact items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(
              [
                {
                  label: "Email",
                  value: "jerryalafo20@gmail.com",
                  href: "mailto:jerryalafo20@gmail.com",
                  color: "#ea4335",
                  glow: "rgba(234,67,53,0.25)",
                  icon: <Mail size={18} />,
                },
                {
                  label: "WhatsApp",
                  value: "+258 833 066 530",
                  href: "https://wa.me/258833066530",
                  color: "#25d366",
                  glow: "rgba(37,211,102,0.25)",
                  icon: <MessageCircle size={18} />,
                },
                {
                  label: "Instagram",
                  value: "@jerry_org_",
                  href: "https://www.instagram.com/jerry_org_/",
                  color: "#e1306c",
                  glow: "rgba(225,48,108,0.25)",
                  icon: <Camera size={18} />,
                },
                {
                  label: "Instagram (trabalhos)",
                  value: "@jerry_org_jobs",
                  href: "https://www.instagram.com/jerry_org_jobs/",
                  color: "#c13584",
                  glow: "rgba(193,53,132,0.25)",
                  icon: <Briefcase size={18} />,
                },
              ] as {
                label: string;
                value: string;
                href: string;
                color: string;
                glow: string;
                icon: React.ReactNode;
              }[]
            ).map((c) => (
              <a
                key={c.value}
                href={c.href}
                target={c.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      `${c.color}44`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      `0 0 16px ${c.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "none";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
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
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        marginBottom: 2,
                        fontFamily: "monospace",
                      }}
                    >
                      {c.label}
                    </div>
                    <div
                      style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}
                    >
                      {c.value}
                    </div>
                  </div>
                  <ExternalLink size={13} color="rgba(255,255,255,0.25)" />
                </div>
              </a>
            ))}
          </div>

          <button
            onClick={() => {
              setShowContact(false);
            }}
            style={{
              marginTop: 18,
              width: "100%",
              padding: "11px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <ArrowLeft
              size={14}
              style={{ marginRight: 6, verticalAlign: "middle" }}
            />
            Voltar às Configurações
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,10,0.85)",
        backdropFilter: "blur(8px)",
        padding: compact ? "12px" : "20px",
      }}
    >
      <div
        style={{
          width: 620,
          maxWidth: "96vw",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "rgba(12,4,28,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: compact ? "18px 16px 16px" : "26px 28px 22px",
          boxShadow: "0 0 80px rgba(123,47,247,0.3)",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Settings size={19} color="#aa55ff" />
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 0.3,
              }}
            >
              Configurações
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.45)",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Two-column: pickers + preview */}
        <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: compact ? 12 : 20, alignItems: "flex-start" }}>
          {/* Left: colour pickers */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 3,
                color: "rgba(200,150,255,0.75)",
                textTransform: "uppercase",
                marginBottom: 14,
                fontFamily: "monospace",
              }}
            >
              Personalizar Personagem
            </div>
            <SettingRow label="Tom de pele">
              {[
                "#f1c27d",
                "#e0ac69",
                "#c68642",
                "#d49560",
                "#8d5524",
                "#4a2911",
              ].map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  active={cfg.skin === c}
                  onClick={() => onSave({ ...cfg, skin: c })}
                />
              ))}
            </SettingRow>
            <SettingRow label="Camisola">
              {[
                "#4a90d9",
                "#e74c3c",
                "#2ecc71",
                "#f39c12",
                "#9b59b6",
                "#1abc9c",
                "#111111",
                "#e8e8e8",
              ].map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  active={cfg.shirt === c}
                  onClick={() => onSave({ ...cfg, shirt: c })}
                />
              ))}
            </SettingRow>
            <SettingRow label="Calções">
              {[
                "#1a2255",
                "#2c3e50",
                "#7f0000",
                "#1a4a1a",
                "#4a3800",
                "#220033",
                "#111111",
                "#334455",
              ].map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  active={cfg.shorts === c}
                  onClick={() => onSave({ ...cfg, shorts: c })}
                />
              ))}
            </SettingRow>
            <SettingRow label="Sapatilhas">
              {[
                "#111111",
                "#e8e8e8",
                "#8b4513",
                "#e74c3c",
                "#1a1a6a",
                "#2ecc71",
              ].map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  active={cfg.shoe === c}
                  onClick={() => onSave({ ...cfg, shoe: c })}
                />
              ))}
            </SettingRow>
          </div>

          {/* Right: character preview */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              paddingTop: compact ? 0 : 24,
              width: compact ? "100%" : "auto",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "18px 22px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CharacterPreview
                skin={cfg.skin}
                shirt={cfg.shirt}
                shorts={cfg.shorts}
                shoe={cfg.shoe}
              />
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}
              >
                Pré-visualização
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.07)",
            margin: "18px 0",
          }}
        />

        {/* Username change */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <UserCog size={16} color="#aa55ff" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              Alterar Username
            </span>
          </div>
        <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: 8 }}>
            <input
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                setRenameMsg(null);
              }}
              placeholder={username || "novo_username"}
              maxLength={20}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              disabled={renameLoading || !newUsername.trim()}
              onClick={async () => {
                setRenameLoading(true);
                setRenameMsg(null);
                try {
                  const res = await fetch("/api/user/rename", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ newUsername }),
                  });
                  const json = (await res.json()) as {
                    ok?: boolean;
                    error?: string;
                  };
                  if (json.ok) {
                    setRenameMsg({
                      ok: true,
                      text: "Alterado! A fazer logout para atualizar sessão…",
                    });
                    setTimeout(
                      () => signOut({ callbackUrl: "/login" }),
                      1800,
                    );
                  } else {
                    setRenameMsg({
                      ok: false,
                      text: json.error ?? "Erro ao alterar.",
                    });
                  }
                } finally {
                  setRenameLoading(false);
                }
              }}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background:
                  renameLoading || !newUsername.trim()
                    ? "rgba(123,47,247,0.25)"
                    : "linear-gradient(135deg,#7b2ff7,#00c3ff)",
                color: "#fff",
                fontWeight: 700,
                cursor:
                  renameLoading || !newUsername.trim()
                    ? "not-allowed"
                    : "pointer",
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              {renameLoading ? "…" : "Guardar"}
            </button>
          </div>
          {renameMsg && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: renameMsg.ok ? "#2ecc71" : "#ff7070",
                fontFamily: "monospace",
              }}
            >
              {renameMsg.text}
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.07)",
            marginBottom: 16,
          }}
        />

        {/* Contact + close row */}
        <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: 10 }}>
          <button
            onClick={() => {
              setShowContact(true);
            }}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
            }}
          >
            <Phone size={15} /> Contacto
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 2,
              padding: "11px",
              background: "linear-gradient(135deg,#7b2ff7,#00c3ff)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              letterSpacing: 0.5,
              fontFamily: "inherit",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
