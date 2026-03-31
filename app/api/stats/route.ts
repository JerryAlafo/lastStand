import { NextResponse } from "next/server";
import { readUsersLines, readScoresLines } from "@/lib/fileStore";

export async function GET() {
  const [userLines, scoreLines] = await Promise.all([
    readUsersLines(),
    readScoresLines(),
  ]);

  const totalUsers = userLines.length;

  // Aggregate scores per user
  const map = new Map<string, { bestScore: number; totalKills: number; gamesPlayed: number }>();
  for (const line of scoreLines) {
    const [username, scoreStr, , killsStr] = line.split("|");
    if (!username) continue;
    const score = Number(scoreStr) || 0;
    const kills = Number(killsStr) || 0;
    const prev = map.get(username) ?? { bestScore: 0, totalKills: 0, gamesPlayed: 0 };
    map.set(username, {
      bestScore: Math.max(prev.bestScore, score),
      totalKills: prev.totalKills + kills,
      gamesPlayed: prev.gamesPlayed + 1,
    });
  }

  const topPlayers = Array.from(map.entries())
    .map(([username, s]) => ({ username, ...s }))
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 10);

  const champion = topPlayers[0] ?? null;
  const totalGames = scoreLines.length;

  return NextResponse.json({ totalUsers, totalGames, topPlayers, champion });
}
