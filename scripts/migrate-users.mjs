// Migration: retroactively assign levels, achievements and weekly scores
// to all existing users based on their score history.
// Run with: node scripts/migrate-users.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.join(__dirname, "..");
const dataDir   = path.join(root, "data");

// ── XP table (mirrors lib/levelSystem.ts) ─────────────────────────────────────
const XP_TABLE = [0];
{
  let xp = 0;
  for (let i = 1; i < 50; i++) {
    xp += Math.floor(300 + i * 180 + i * i * 12);
    XP_TABLE.push(xp);
  }
}

function getLevel(totalXp) {
  let lv = 1;
  for (let i = 1; i < XP_TABLE.length; i++) {
    if (totalXp >= XP_TABLE[i]) lv = i + 1; else break;
  }
  return Math.min(lv, 50);
}

function xpForGame(score, wave, kills) {
  return Math.floor(score / 10 + wave * 20 + kills * 2);
}

function getWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ── Achievement definitions (mirrors lib/levelSystem.ts) ─────────────────────
const ACHIEVEMENTS = [
  { id: "first_blood",  type: "totalKills",   target: 1     },
  { id: "kills_10",     type: "totalKills",   target: 10    },
  { id: "kills_100",    type: "totalKills",   target: 100   },
  { id: "kills_500",    type: "totalKills",   target: 500   },
  { id: "kills_1000",   type: "totalKills",   target: 1000  },
  { id: "kills_5000",   type: "totalKills",   target: 5000  },
  { id: "wave_5",       type: "maxWave",      target: 5     },
  { id: "wave_10",      type: "maxWave",      target: 10    },
  { id: "wave_20",      type: "maxWave",      target: 20    },
  { id: "score_1k",     type: "bestScore",    target: 1000  },
  { id: "score_10k",    type: "bestScore",    target: 10000 },
  { id: "score_50k",    type: "bestScore",    target: 50000 },
  { id: "pvp_win",      type: "pvpWins",      target: 1     },
  { id: "pvp_5",        type: "pvpWins",      target: 5     },
  { id: "level_10",     type: "level",        target: 10    },
  { id: "level_20",     type: "level",        target: 20    },
  { id: "level_30",     type: "level",        target: 30    },
  // session-based: best single game
  { id: "session_100k", type: "bestKills",    target: 100   },
  { id: "session_w15",  type: "bestWave",     target: 15    },
  // blast_5 skipped — can't retroactively determine
];

async function readFile(filename) {
  try {
    const raw = await fs.readFile(path.join(dataDir, filename), "utf8");
    return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function writeFile(filename, content) {
  await fs.writeFile(path.join(dataDir, filename), content, "utf8");
}

// ── Main migration ─────────────────────────────────────────────────────────────
(async () => {
  const [scoreLines, pvpLines, userLines] = await Promise.all([
    readFile("scores.txt"),
    readFile("pvp_wins.txt"),
    readFile("users.txt"),
  ]);

  const currentWeek = getWeekId();
  const now = Date.now();

  // Parse all usernames
  const allUsers = userLines.map(l => l.split("|")[0]).filter(Boolean);

  // Parse all scores
  const scoresByUser = new Map();
  for (const line of scoreLines) {
    const parts = line.split("|");
    const username = parts[0];
    const score    = Number(parts[1]) || 0;
    const wave     = Number(parts[2]) || 0;
    const kills    = Number(parts[3]) || 0;
    const ts       = Number(parts[4]) || 0;
    if (!username) continue;
    if (!scoresByUser.has(username)) scoresByUser.set(username, []);
    scoresByUser.get(username).push({ score, wave, kills, ts });
  }

  // Parse PVP wins
  const pvpWinsByUser = new Map();
  for (const line of pvpLines) {
    const [u] = line.split("|");
    if (u) pvpWinsByUser.set(u, (pvpWinsByUser.get(u) ?? 0) + 1);
  }

  // ── Compute per user ────────────────────────────────────────────────────────
  const levelLines       = [];
  const achievementLines = [];
  const weeklyLines      = [];

  for (const username of allUsers) {
    const games     = scoresByUser.get(username) ?? [];
    const pvpWins   = pvpWinsByUser.get(username) ?? 0;

    // Cumulative stats
    const totalKills = games.reduce((s, g) => s + g.kills, 0);
    const bestScore  = games.reduce((s, g) => Math.max(s, g.score), 0);
    const maxWave    = games.reduce((s, g) => Math.max(s, g.wave), 0);
    const bestKills  = games.reduce((s, g) => Math.max(s, g.kills), 0); // best single game
    const totalXp    = games.reduce((s, g) => s + xpForGame(g.score, g.wave, g.kills), 0);
    const level      = getLevel(totalXp);

    // Level record
    levelLines.push(`${username}|${totalXp}|${level}|`);

    // Achievements
    const stats = { totalKills, bestScore, maxWave, bestKills, bestWave: maxWave, pvpWins, level };
    for (const ach of ACHIEVEMENTS) {
      const val = stats[ach.type] ?? 0;
      if (val >= ach.target) {
        achievementLines.push(`${username}|${ach.id}|${now}`);
      }
    }

    // Weekly scores — add best game from this week (or all games if ts = 0, treating historical as "this week" seeding)
    // For existing historical data: add their best score ever as a one-time weekly entry
    if (bestScore > 0) {
      // Find their best game ever and add as a this-week entry so they appear in weekly rankings
      const best = games.reduce((b, g) => g.score > b.score ? g : b, { score: 0, wave: 0, kills: 0, ts: now });
      weeklyLines.push(`${username}|${best.score}|${best.wave}|${best.kills}|${currentWeek}|${best.ts || now}`);
    }

    console.log(`${username.padEnd(24)} | XP: ${String(totalXp).padStart(7)} | Lv.${level} | kills: ${totalKills} | achv: ${achievementLines.filter(l => l.startsWith(username + "|")).length}`);
  }

  // ── Write files ──────────────────────────────────────────────────────────────
  await writeFile("levels.txt",        levelLines.join("\n")       + "\n");
  await writeFile("achievements.txt",  achievementLines.join("\n") + "\n");
  await writeFile("weekly_scores.txt", weeklyLines.join("\n")      + "\n");

  console.log("\n✅ Migration complete!");
  console.log(`   levels.txt:        ${levelLines.length} users`);
  console.log(`   achievements.txt:  ${achievementLines.length} entries`);
  console.log(`   weekly_scores.txt: ${weeklyLines.length} entries`);
})();
