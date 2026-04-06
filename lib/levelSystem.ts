// ── Level thresholds (50 levels) ─────────────────────────────────────────────
// XP required to REACH each level (level 1 = 0 xp)
const XP_TABLE: number[] = [0];
{
  let xp = 0;
  for (let i = 1; i < 50; i++) {
    xp += Math.floor(300 + i * 180 + i * i * 12);
    XP_TABLE.push(xp);
  }
}

export function getLevel(totalXp: number): number {
  let lv = 1;
  for (let i = 1; i < XP_TABLE.length; i++) {
    if (totalXp >= XP_TABLE[i]) lv = i + 1; else break;
  }
  return Math.min(lv, 50);
}

export function xpForLevel(level: number): number {
  return XP_TABLE[Math.min(level - 1, XP_TABLE.length - 1)] ?? 0;
}

export function xpForGame(score: number, wave: number, kills: number): number {
  return Math.floor(score / 10 + wave * 20 + kills * 2);
}

export function getLevelTitle(level: number): string {
  if (level >= 40) return "Lendário";
  if (level >= 30) return "Campeão";
  if (level >= 20) return "Elite";
  if (level >= 10) return "Veterano";
  return "Recruta";
}

export function getLevelColor(level: number): string {
  if (level >= 40) return "#ff6600";
  if (level >= 30) return "#aa00ff";
  if (level >= 20) return "#0099ff";
  if (level >= 10) return "#00cc66";
  return "#888888";
}

// ── Weekly helpers ─────────────────────────────────────────────────────────────
export function getWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // ISO week: Monday start
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ── Daily missions ─────────────────────────────────────────────────────────────
export interface MissionDef {
  id: string;
  desc: string;
  type: "kills" | "wave" | "blast" | "score" | "kills_session";
  target: number;
  xpReward: number;
}

const MISSION_POOL: MissionDef[] = [
  { id: "m1",  desc: "Mata 50 inimigos hoje",         type: "kills",         target: 50,   xpReward: 200 },
  { id: "m2",  desc: "Sobrevive à wave 10",            type: "wave",          target: 10,   xpReward: 300 },
  { id: "m3",  desc: "Usa blast 3 vezes",              type: "blast",         target: 3,    xpReward: 150 },
  { id: "m4",  desc: "Faz 5000 pontos numa partida",   type: "score",         target: 5000, xpReward: 250 },
  { id: "m5",  desc: "Mata 100 inimigos hoje",         type: "kills",         target: 100,  xpReward: 400 },
  { id: "m6",  desc: "Sobrevive à wave 5",             type: "wave",          target: 5,    xpReward: 150 },
  { id: "m7",  desc: "Faz 2000 pontos numa partida",   type: "score",         target: 2000, xpReward: 150 },
  { id: "m8",  desc: "Mata 30 inimigos numa partida",  type: "kills_session", target: 30,   xpReward: 120 },
  { id: "m9",  desc: "Sobrevive à wave 15",            type: "wave",          target: 15,   xpReward: 500 },
  { id: "m10", desc: "Mata 20 inimigos hoje",          type: "kills",         target: 20,   xpReward: 100 },
  { id: "m11", desc: "Faz 1000 pontos numa partida",   type: "score",         target: 1000, xpReward: 80  },
  { id: "m12", desc: "Usa blast 5 vezes",              type: "blast",         target: 5,    xpReward: 250 },
];

export function getDailyMissions(dateStr: string): MissionDef[] {
  const hash = dateStr.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const pool = [...MISSION_POOL];
  const result: MissionDef[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.abs((hash + i * 1337) % pool.length);
    result.push(...pool.splice(idx % pool.length, 1));
  }
  return result;
}

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Achievements ───────────────────────────────────────────────────────────────
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  type: "bestScore" | "totalKills" | "maxWave" | "level" | "pvpWins" | "sessionKills" | "sessionWave" | "sessionBlast";
  target: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_blood",  name: "Primeira Morte",     icon: "🩸", desc: "Mata o primeiro inimigo",             type: "totalKills",    target: 1     },
  { id: "kills_10",     name: "Caçador",             icon: "🏹", desc: "Mata 10 inimigos total",              type: "totalKills",    target: 10    },
  { id: "kills_100",    name: "Centurião",            icon: "💯", desc: "Mata 100 inimigos total",             type: "totalKills",    target: 100   },
  { id: "kills_500",    name: "Exterminador",         icon: "🔪", desc: "Mata 500 inimigos total",             type: "totalKills",    target: 500   },
  { id: "kills_1000",   name: "Mil Mortes",           icon: "💀", desc: "Mata 1000 inimigos total",            type: "totalKills",    target: 1000  },
  { id: "kills_5000",   name: "Massacrador",          icon: "☠️", desc: "Mata 5000 inimigos total",            type: "totalKills",    target: 5000  },
  { id: "wave_5",       name: "Sobrevivente",         icon: "🛡️", desc: "Sobrevive à wave 5",                  type: "maxWave",       target: 5     },
  { id: "wave_10",      name: "Herói da Arena",       icon: "⚔️", desc: "Sobrevive à wave 10",                 type: "maxWave",       target: 10    },
  { id: "wave_20",      name: "Veterano da Arena",    icon: "🏟️", desc: "Sobrevive à wave 20",                 type: "maxWave",       target: 20    },
  { id: "score_1k",     name: "Mil Pontos",           icon: "⭐", desc: "Faz 1000 pontos",                     type: "bestScore",     target: 1000  },
  { id: "score_10k",    name: "Dez Mil",              icon: "🌟", desc: "Faz 10000 pontos",                    type: "bestScore",     target: 10000 },
  { id: "score_50k",    name: "Cinquenta Mil",        icon: "💫", desc: "Faz 50000 pontos",                    type: "bestScore",     target: 50000 },
  { id: "pvp_win",      name: "Duelista",             icon: "⚡", desc: "Vence uma partida PVP",               type: "pvpWins",       target: 1     },
  { id: "pvp_5",        name: "Gladiador",            icon: "🥊", desc: "Vence 5 partidas PVP",                type: "pvpWins",       target: 5     },
  { id: "level_10",     name: "Veterano",             icon: "🎖️", desc: "Atinge o nível 10",                   type: "level",         target: 10    },
  { id: "level_20",     name: "Elite",                icon: "🎗️", desc: "Atinge o nível 20",                   type: "level",         target: 20    },
  { id: "level_30",     name: "Campeão",              icon: "👑", desc: "Atinge o nível 30",                   type: "level",         target: 30    },
  { id: "session_100k", name: "Carnificina",          icon: "🔥", desc: "Mata 100 inimigos numa partida",      type: "sessionKills",  target: 100   },
  { id: "session_w15",  name: "Campeão da Wave",      icon: "🏆", desc: "Sobrevive à wave 15 numa partida",    type: "sessionWave",   target: 15    },
  { id: "blast_5",      name: "Mestre da Fúria",      icon: "💥", desc: "Usa blast 5x numa partida",           type: "sessionBlast",  target: 5     },
];

export interface CumulativeStats {
  totalKills: number;
  bestScore: number;
  maxWave: number;
  level: number;
  pvpWins: number;
}

export interface SessionStats {
  kills: number;
  wave: number;
  blast: number;
}

export function getNewAchievements(
  cumul: CumulativeStats,
  session: SessionStats,
  already: Set<string>,
): string[] {
  const newOnes: string[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (already.has(ach.id)) continue;
    let met = false;
    switch (ach.type) {
      case "totalKills":    met = cumul.totalKills  >= ach.target; break;
      case "bestScore":     met = cumul.bestScore   >= ach.target; break;
      case "maxWave":       met = cumul.maxWave     >= ach.target; break;
      case "level":         met = cumul.level       >= ach.target; break;
      case "pvpWins":       met = cumul.pvpWins     >= ach.target; break;
      case "sessionKills":  met = session.kills     >= ach.target; break;
      case "sessionWave":   met = session.wave      >= ach.target; break;
      case "sessionBlast":  met = session.blast     >= ach.target; break;
    }
    if (met) newOnes.push(ach.id);
  }
  return newOnes;
}
