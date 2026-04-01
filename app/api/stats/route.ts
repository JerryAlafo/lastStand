import { NextResponse } from "next/server";
import { readUsersLines, readScoresLines, readPvpWinsLines } from "@/lib/fileStore";

export async function GET() {
  const [userLines, scoreLines, pvpLines] = await Promise.all([
    readUsersLines(),
    readScoresLines(),
    readPvpWinsLines(),
  ]);

  const totalUsers = userLines.length;

  // ── Solo stats ──────────────────────────────────────────────────────────────
  const soloMap = new Map<string, { bestScore: number; totalKills: number; gamesPlayed: number }>();
  for (const line of userLines) {
    const username = line.split("|")[0];
    if (username) soloMap.set(username, { bestScore: 0, totalKills: 0, gamesPlayed: 0 });
  }
  for (const line of scoreLines) {
    const [username, scoreStr, , killsStr] = line.split("|");
    if (!username) continue;
    const score = Number(scoreStr) || 0;
    const kills = Number(killsStr) || 0;
    const prev = soloMap.get(username) ?? { bestScore: 0, totalKills: 0, gamesPlayed: 0 };
    soloMap.set(username, {
      bestScore: Math.max(prev.bestScore, score),
      totalKills: prev.totalKills + kills,
      gamesPlayed: prev.gamesPlayed + 1,
    });
  }

  const topSolo = Array.from(soloMap.entries())
    .map(([username, s]) => ({ username, ...s }))
    .sort((a, b) => b.bestScore - a.bestScore || a.username.localeCompare(b.username))
    .slice(0, 10);

  // ── PVP stats ───────────────────────────────────────────────────────────────
  const pvpMap = new Map<string, number>(); // username → win count
  for (const line of userLines) {
    const username = line.split("|")[0];
    if (username) pvpMap.set(username, 0);
  }
  for (const line of pvpLines) {
    const username = line.split("|")[0];
    if (!username) continue;
    pvpMap.set(username, (pvpMap.get(username) ?? 0) + 1);
  }

  // Count how many PVP games each player appeared in (win = 1 game at minimum)
  const pvpGamesMap = new Map<string, number>();
  for (const line of pvpLines) {
    const username = line.split("|")[0];
    if (username) pvpGamesMap.set(username, (pvpGamesMap.get(username) ?? 0) + 1);
  }

  const topPvp = Array.from(pvpMap.entries())
    .map(([username, pvpWins]) => ({
      username,
      pvpWins,
      pvpGamesPlayed: pvpGamesMap.get(username) ?? 0,
    }))
    .sort((a, b) => b.pvpWins - a.pvpWins || a.username.localeCompare(b.username))
    .slice(0, 10);

  const soloChampion  = topSolo[0] ?? null;
  const pvpChampion   = topPvp.find(p => p.pvpWins > 0) ?? null;
  const totalGames    = scoreLines.length;
  const totalPvpGames = pvpLines.length;

  return NextResponse.json({
    totalUsers,
    totalGames,
    totalPvpGames,
    topPlayers: topSolo,   // kept for backwards compat
    topSolo,
    topPvp,
    champion: soloChampion,
    soloChampion,
    pvpChampion,
  });
}
