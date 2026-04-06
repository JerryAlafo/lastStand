import { NextResponse } from "next/server";
import {
  readUsersLines, readScoresLines, readAchievementsLines,
  readLevelsLines, readPvpWinsLines, readWeeklyLines,
} from "@/lib/fileStore";
import { getLevelTitle, getLevelColor } from "@/lib/levelSystem";

function getWeekId(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  return start.toISOString().split("T")[0];
}

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  try {
    const username = params.username;

    const [userLines, scoreLines, levelLines, achLines, pvpLines, weeklyLines] = await Promise.all([
      readUsersLines(),
      readScoresLines(),
      readLevelsLines(),
      readAchievementsLines(),
      readPvpWinsLines(),
      readWeeklyLines(),
    ]);

    const userExists = userLines.some(l => l.split("|")[0] === username);
    if (!userExists) {
      return NextResponse.json({ error: "Jogador não encontrado." }, { status: 404 });
    }

    const userScores = scoreLines
      .map(l => {
        const [u, s, w, k, ts] = l.split("|");
        if (u !== username) return null;
        return { score: Number(s) || 0, wave: Number(w) || 0, kills: Number(k) || 0, timestamp: Number(ts) || 0 };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    const bestScore = Math.max(0, ...userScores.map(s => s.score));
    const bestWave = Math.max(0, ...userScores.map(s => s.wave));
    const totalKills = userScores.reduce((sum, s) => sum + s.kills, 0);
    const gamesPlayed = userScores.length;

    const levelInfo = levelLines
      .map(l => {
        const [u, xpS, lvS, cls] = l.split("|");
        if (u !== username) return null;
        return { level: Number(lvS) || 1, totalXp: Number(xpS) || 0, selectedClass: cls || null };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)[0] ?? { level: 1, totalXp: 0, selectedClass: null };

    const title = getLevelTitle(levelInfo.level);
    const color = getLevelColor(levelInfo.level);

    const achievements = achLines
      .filter(l => l.split("|")[0] === username)
      .map(l => l.split("|")[1])
      .filter(Boolean);

    const pvpWins = pvpLines.filter(l => l.split("|")[0] === username).length;

    const weekId = getWeekId();
    const weeklyBest = weeklyLines
      .filter(l => {
        const [u, , , , wk] = l.split("|");
        return u === username && wk === weekId;
      })
      .map(l => Number(l.split("|")[1]) || 0)
      .reduce((max, s) => Math.max(max, s), 0);

    const scoreHistory = userScores.map(s => ({
      score: s.score,
      wave: s.wave,
      kills: s.kills,
      date: new Date(s.timestamp).toISOString(),
    }));

    return NextResponse.json({
      username,
      level: levelInfo.level,
      totalXp: levelInfo.totalXp,
      title,
      color,
      selectedClass: levelInfo.selectedClass,
      bestScore,
      bestWave,
      totalKills,
      gamesPlayed,
      pvpWins,
      weeklyBest,
      achievements,
      scoreHistory,
    });
  } catch {
    return NextResponse.json({ error: "Falha ao carregar perfil." }, { status: 500 });
  }
}
