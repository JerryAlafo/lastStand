"use client";

import { Button, Avatar } from "@mui/material";
import { Pause, Play, Settings, Home, LogOut } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

interface Props {
  wave: number;
  score: number;
  kills: number;
  isMobile: boolean;
  session: Session | null;
  best: number | null;
  initials: string;
  username: string;
  onResume: () => void;
  onSettings: () => void;
  goToMenu: () => void;
}

export default function PauseModal({ wave, score, kills, isMobile, session, best, initials, username, onResume, onSettings, goToMenu }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5,0,20,0.75)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* Stats row */}
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 2, marginBottom: 20 }}>
        WAVE <span style={{ color: "#f39c12" }}>{wave}</span>
        {" · "}
        <span style={{ color: "#fff" }}>{score} pts</span>
        {" · "}
        <span style={{ color: "#e74c3c" }}>{kills} kills</span>
      </div>

      {/* Card */}
      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          padding: "32px 36px",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 0 60px rgba(123,47,247,0.2)",
          minWidth: 280,
          maxWidth: "90vw",
        }}
      >
        <Pause size={38} color="rgba(200,170,255,0.85)" strokeWidth={1.5} />
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3, fontFamily: "monospace", color: "#fff" }}>
          PAUSADO
        </div>

        {/* User card — mobile only */}
        {isMobile && session?.user?.username && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "10px 14px", background: "rgba(255,255,255,0.05)",
            borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <Avatar sx={{
              width: 34, height: 34, bgcolor: "rgba(123,47,247,0.25)",
              border: "1px solid rgba(123,47,247,0.4)",
              color: "#fff", fontWeight: 800, fontSize: 13,
            }}>
              {initials}
            </Avatar>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {username}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                Melhor:{" "}<span style={{ color: "#7b2ff7", fontWeight: 700 }}>{best ?? "—"}</span>
                {" · "}Kills:{" "}<span style={{ color: "#e74c3c", fontWeight: 700 }}>{kills}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
          <Button
            onClick={onResume}
            variant="contained"
            fullWidth
            startIcon={<Play size={16} />}
            sx={{
              background: "linear-gradient(135deg,#2ecc71,#27ae60)",
              fontFamily: "monospace",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              py: 1.4,
              fontSize: 14,
              boxShadow: "0 0 20px rgba(46,204,113,0.4)",
              "&:hover": { background: "linear-gradient(135deg,#27ae60,#1e8449)" },
            }}
          >
            Retomar
          </Button>

          <Button
            onClick={onSettings}
            variant="outlined"
            fullWidth
            startIcon={<Settings size={16} />}
            sx={{
              borderColor: "rgba(255,255,255,0.18)",
              color: "#fff",
              fontFamily: "monospace",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              py: 1.2,
              fontSize: 13,
              "&:hover": { borderColor: "rgba(255,255,255,0.35)", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            Configurações
          </Button>

          <Button
            onClick={goToMenu}
            variant="outlined"
            fullWidth
            startIcon={<Home size={16} />}
            sx={{
              borderColor: "rgba(255,100,100,0.3)",
              color: "rgba(255,160,160,0.85)",
              fontFamily: "monospace",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              py: 1.2,
              fontSize: 13,
              "&:hover": { borderColor: "rgba(255,100,100,0.5)", bgcolor: "rgba(255,50,50,0.06)" },
            }}
          >
            Menu Principal
          </Button>

          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="text"
            fullWidth
            startIcon={<LogOut size={13} />}
            sx={{
              color: "rgba(255,255,255,0.3)",
              fontFamily: "monospace",
              textTransform: "none",
              fontSize: 12,
              py: 0.8,
              "&:hover": { color: "rgba(255,255,255,0.55)" },
            }}
          >
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
