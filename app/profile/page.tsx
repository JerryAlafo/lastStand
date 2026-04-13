"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  ArrowLeft, User, Star, Target, Trophy, Sword, Shield, Zap,
  CheckCircle2, Lock, Flame, Droplets, Crosshair, ShieldCheck,
  Award, Sparkles, Gem, Crown, Medal, Skull, Bomb, BadgeCheck,
} from "lucide-react";

interface LevelInfo {
  level: number;
  totalXp: number;
  title: string;
  color: string;
  selectedClass: string | null;
  xpProgress: number;
  xpNeeded: number;
}

interface Mission {
  id: string;
  desc: string;
  target: number;
  xpReward: number;
  progress: number;
  completed: boolean;
}

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}

const CLASS_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; desc: string; req: number }> = {
  warrior:      { label: "Guerreiro",   icon: <Shield size={20} />,  color: "#e74c3c", desc: "+HP, lento",          req: 10 },
  assassin:    { label: "Assassino",   icon: <Sword size={20} />,   color: "#aa00ff", desc: "Veloz, -HP",          req: 20 },
  mage:        { label: "Mago",        icon: <Flame size={20} />,   color: "#0088ff", desc: "2 balas, lento",      req: 30 },
  archer:      { label: "Arqueiro",   icon: <Target size={20} />, color: "#00cc66", desc: "Tiro rápido",         req: 40 },
  paladin:     { label: "Paladino",   icon: <Crown size={20} />,  color: "#ffaa00", desc: "++HP, lento",         req: 60 },
  necromancer: { label: "Necromante", icon: <Skull size={20} />, color: "#8844ff", desc: "3 burlas",           req: 80 },
};

// Map achievement ID → lucide icon element
const ACH_ICONS: Record<string, React.ReactNode> = {
  first_blood:  <Droplets   size={22} />,
  kills_10:     <Crosshair  size={22} />,
  kills_100:    <Target     size={22} />,
  kills_500:    <Sword      size={22} />,
  kills_1000:   <Skull      size={22} />,
  kills_5000:   <Skull      size={22} />,
  wave_5:       <Shield     size={22} />,
  wave_10:      <ShieldCheck size={22} />,
  wave_20:      <Award      size={22} />,
  score_1k:     <Star       size={22} />,
  score_10k:    <Sparkles   size={22} />,
  score_50k:    <Gem        size={22} />,
  pvp_win:      <Zap        size={22} />,
  pvp_5:        <Sword      size={22} />,
  level_10:     <Medal      size={22} />,
  level_20:     <BadgeCheck size={22} />,
  level_30:     <Crown      size={22} />,
  level_40:     <Crosshair size={22} />,
  level_60:     <Shield    size={22} />,
  level_80:     <Skull     size={22} />,
  level_100:    <Star      size={22} />,
  session_100k: <Flame     size={22} />,
  session_w15:  <Trophy     size={22} />,
  blast_5:      <Bomb       size={22} />,
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:640px)");

  const [levelInfo,     setLevelInfo]     = useState<LevelInfo | null>(null);
  const [missions,      setMissions]      = useState<Mission[]>([]);
  const [achievements,  setAchievements]  = useState<Achievement[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [classChanging, setClassChanging] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const [lv, ms, ach] = await Promise.all([
          fetch("/api/user/level").then(r => r.ok ? r.json() : null),
          fetch("/api/missions").then(r => r.ok ? r.json() : { missions: [] }),
          fetch("/api/achievements").then(r => r.ok ? r.json() : { achievements: [] }),
        ]);
        if (lv) setLevelInfo(lv);
        setMissions(ms.missions ?? []);
        setAchievements(ach.achievements ?? []);
      } catch {
        // show partial data
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  async function selectClass(cls: string) {
    if (!levelInfo) return;
    const info = CLASS_INFO[cls];
    if (levelInfo.level < info.req) return;
    setClassChanging(true);
    try {
      const res = await fetch("/api/user/level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedClass: cls }),
      });
      if (res.ok) setLevelInfo(prev => prev ? { ...prev, selectedClass: cls } : prev);
    } finally {
      setClassChanging(false);
    }
  }

  const unlockedCount      = achievements.filter(a => a.unlocked).length;
  const missionsCompleted  = missions.filter(m => m.completed).length;

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden", background: "radial-gradient(ellipse at 50% 20%, #1a0a3a 0%, #0a0010 65%)", color: "#fff", padding: "28px 20px", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}>
      <div style={{ position: "fixed", top: "5%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,47,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <Box sx={{ maxWidth: 760, mx: "auto", position: "relative", zIndex: 1, minWidth: 0 }}>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button onClick={() => router.push("/game")} startIcon={<ArrowLeft size={16} />} variant="outlined"
            sx={{ flexShrink: 0, color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 2, textTransform: "none", "&:hover": { borderColor: "rgba(255,255,255,0.35)", bgcolor: "rgba(255,255,255,0.05)" } }}>
            Voltar
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <User size={24} color="#aa55ff" style={{ filter: "drop-shadow(0 0 8px #aa55ff66)" }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #fff, #aa55ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 0.5 }}>
              Perfil
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)", ml: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session?.user?.username}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 10, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>A carregar...</Box>
        ) : (
          <>
            {/* Level Card */}
            {levelInfo && (
              <Box sx={{ mb: 3, p: "20px 24px", background: "rgba(255,255,255,0.04)", border: `1px solid ${levelInfo.color}44`, borderRadius: 3, backdropFilter: "blur(12px)", boxShadow: `0 0 40px ${levelInfo.color}22` }}>
                {/* Top row: avatar + name + stats */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                  {/* Level circle */}
                  <Box sx={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${levelInfo.color}22`, border: `2px solid ${levelInfo.color}66`, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 900, color: levelInfo.color }}>{levelInfo.level}</Typography>
                  </Box>

                  {/* Name + title */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>
                        {session?.user?.username}
                      </Typography>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: `${levelInfo.color}22`, border: `1px solid ${levelInfo.color}55`, color: levelInfo.color, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {levelInfo.title}
                      </span>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mt: 0.3, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Star size={11} />
                      {levelInfo.totalXp.toLocaleString()} XP · Nível {levelInfo.level}
                    </Typography>
                  </Box>

                  {/* Mini stats */}
                  <Box sx={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace" }}>Missões</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#ffd700", lineHeight: 1.2 }}>{missionsCompleted}/3</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace" }}>Conquistas</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#aa55ff", lineHeight: 1.2 }}>{unlockedCount}/{achievements.length}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* XP bar */}
                {levelInfo.level < 50 ? (
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                        XP para Nv.{levelInfo.level + 1}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                        {levelInfo.xpProgress.toLocaleString()} / {levelInfo.xpNeeded.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${Math.min(100, (levelInfo.xpProgress / levelInfo.xpNeeded) * 100)}%`, background: `linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}cc)`, borderRadius: 4, transition: "width 0.8s ease", boxShadow: `0 0 8px ${levelInfo.color}88` }} />
                    </Box>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 12, color: levelInfo.color, fontWeight: 700, textAlign: "center" }}>Nível máximo atingido!</Typography>
                )}
              </Box>
            )}

            {/* Class Selection */}
            <Box sx={{ mb: 3, p: "20px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, backdropFilter: "blur(12px)" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace", mb: 2 }}>
                Classe
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {(["warrior", "assassin", "mage", "archer", "paladin", "necromancer"] as const).map(cls => {
                  const info = CLASS_INFO[cls];
                  const unlocked = (levelInfo?.level ?? 0) >= info.req;
                  const active   = levelInfo?.selectedClass === cls;
                  return (
                    <Box key={cls} onClick={() => unlocked && !classChanging && selectClass(cls)}
                      sx={{ flex: 1, minWidth: 130, p: "14px 16px", borderRadius: 2.5, cursor: unlocked ? "pointer" : "default", opacity: unlocked ? 1 : 0.45, transition: "all 0.2s",
                        border: `1px solid ${active ? info.color : "rgba(255,255,255,0.1)"}`,
                        background: active ? `${info.color}18` : "rgba(255,255,255,0.03)",
                        boxShadow: active ? `0 0 20px ${info.color}33` : "none",
                        "&:hover": unlocked ? { border: `1px solid ${info.color}88`, background: `${info.color}12` } : {} }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, color: active ? info.color : unlocked ? "#fff" : "rgba(255,255,255,0.4)" }}>
                        {unlocked ? info.icon : <Lock size={18} />}
                        <Typography sx={{ fontSize: 14, fontWeight: 800, color: "inherit" }}>{info.label}</Typography>
                        {active && <CheckCircle2 size={13} style={{ marginLeft: "auto" }} />}
                      </Box>
                      <Typography sx={{ fontSize: 11, color: active ? info.color : "rgba(255,255,255,0.4)" }}>{info.desc}</Typography>
                      {!unlocked && (
                        <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)", mt: 0.5, fontFamily: "monospace" }}>Nível {info.req} necessário</Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
              {!levelInfo?.selectedClass && (
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)", mt: 1.5, fontFamily: "monospace" }}>
                  Seleciona uma classe para obter bónus especiais no jogo.
                </Typography>
              )}
            </Box>

            {/* Daily Missions */}
            <Box sx={{ mb: 3, p: "20px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, backdropFilter: "blur(12px)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Target size={15} color="#ffd700" />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace" }}>
                  Missões Diárias
                </Typography>
                <Typography sx={{ ml: "auto", fontSize: 11, color: missionsCompleted === 3 ? "#ffd700" : "rgba(255,255,255,0.35)", fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>
                  {missionsCompleted}/3 concluídas
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {missions.map(m => {
                  const pct = Math.min(100, (m.progress / m.target) * 100);
                  return (
                    <Box key={m.id} sx={{ p: "12px 14px", borderRadius: 2, background: m.completed ? "rgba(255,215,0,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${m.completed ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.8, gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                          {m.completed ? <CheckCircle2 size={14} color="#ffd700" style={{ flexShrink: 0 }} /> : <Target size={14} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />}
                          <Typography sx={{ fontSize: 13, color: m.completed ? "#ffd700" : "#fff", fontWeight: m.completed ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.desc}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                          <Zap size={11} color="#aa55ff" />
                          <Typography sx={{ fontSize: 11, color: "#aa55ff", fontWeight: 700, fontFamily: "monospace" }}>+{m.xpReward} XP</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ flex: 1, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${pct}%`, background: m.completed ? "linear-gradient(90deg,#ffd700,#e0a800)" : "linear-gradient(90deg,#7b2ff7,#aa55ff)", borderRadius: 3, transition: "width 0.6s ease" }} />
                        </Box>
                        <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", flexShrink: 0 }}>
                          {m.progress}/{m.target}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Achievements */}
            <Box sx={{ p: "20px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, backdropFilter: "blur(12px)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Trophy size={15} color="#aa55ff" />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace" }}>
                  Conquistas
                </Typography>
                <Typography sx={{ ml: "auto", fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", flexShrink: 0 }}>
                  {unlockedCount}/{achievements.length}
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(4,1fr)", gap: 1.5 }}>
                {achievements.map(a => {
                  const icon = ACH_ICONS[a.id];
                  const iconColor = a.unlocked ? "#aa55ff" : "rgba(255,255,255,0.25)";
                  return (
                    <Box key={a.id} sx={{ p: "12px 10px", borderRadius: 2, textAlign: "center", background: a.unlocked ? "rgba(170,85,255,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${a.unlocked ? "rgba(170,85,255,0.35)" : "rgba(255,255,255,0.06)"}`, opacity: a.unlocked ? 1 : 0.5, transition: "all 0.2s" }}>
                      <Box sx={{ display: "flex", justifyContent: "center", mb: 0.8, color: iconColor }}>
                        {icon}
                      </Box>
                      <Typography sx={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: a.unlocked ? "#fff" : "rgba(255,255,255,0.4)", lineHeight: 1.2 }}>{a.name}</Typography>
                      {!isMobile && (
                        <Typography sx={{ fontSize: 9, color: "rgba(255,255,255,0.3)", mt: 0.4, lineHeight: 1.2 }}>{a.desc}</Typography>
                      )}
                      {a.unlocked && (
                        <Box sx={{ mt: 0.6, width: 5, height: 5, borderRadius: "50%", background: "#aa55ff", mx: "auto" }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>
                Last Stand Arena · {session?.user?.username}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </div>
  );
}
