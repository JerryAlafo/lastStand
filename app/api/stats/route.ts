import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getLevelTitle, getLevelColor } from "@/lib/levelSystem";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceClient();

  const [profilesResult, scoresResult, pvpResult, levelsResult] = await Promise.all([
    supabase.from("profiles").select("id, username"),
    supabase.from("scores").select("user_id, score, kills"),
    supabase.from("pvp_wins").select("user_id"),
    supabase.from("user_levels").select("user_id, level"),
  ]);

  const profiles = profilesResult.data || [];
  const scores = scoresResult.data || [];
  const pvpWins = pvpResult.data || [];
  const levels = levelsResult.data || [];

  const levelMap = new Map<string, { level: number; title: string; color: string }>();
  for (const l of levels) {
    if (l.user_id) {
      levelMap.set(l.user_id, {
        level: l.level || 1,
        title: getLevelTitle(l.level || 1),
        color: getLevelColor(l.level || 1),
      });
    }
  }

  const totalUsers = profiles.length;

  const soloMap = new Map<string, { bestScore: number; totalKills: number; gamesPlayed: number }>();
  for (const p of profiles) {
    soloMap.set(p.id, { bestScore: 0, totalKills: 0, gamesPlayed: 0 });
  }
  for (const s of scores) {
    if (!s.user_id) continue;
    const prev = soloMap.get(s.user_id) ?? { bestScore: 0, totalKills: 0, gamesPlayed: 0 };
    soloMap.set(s.user_id, {
      bestScore: Math.max(prev.bestScore, s.score || 0),
      totalKills: prev.totalKills + (s.kills || 0),
      gamesPlayed: prev.gamesPlayed + 1,
    });
  }

  const pvpMap = new Map<string, number>();
  for (const p of profiles) {
    pvpMap.set(p.id, 0);
  }
  for (const w of pvpWins) {
    if (w.user_id) {
      pvpMap.set(w.user_id, (pvpMap.get(w.user_id) ?? 0) + 1);
    }
  }

  const profileMap = new Map<string, string>();
  for (const p of profiles) {
    profileMap.set(p.id, p.username);
  }

  const topSolo = Array.from(soloMap.entries())
    .map(([userId, s]) => {
      const username = profileMap.get(userId) || userId;
      const lv = levelMap.get(userId) ?? { level: 1, title: getLevelTitle(1), color: getLevelColor(1) };
      return { username, ...s, ...lv };
    })
    .sort((a, b) => b.bestScore - a.bestScore || a.username.localeCompare(b.username));

  const topPvp = Array.from(pvpMap.entries())
    .map(([userId, pvpWinsCount]) => {
      const username = profileMap.get(userId) || userId;
      const lv = levelMap.get(userId) ?? { level: 1, title: getLevelTitle(1), color: getLevelColor(1) };
      return { username, pvpWins: pvpWinsCount, pvpGamesPlayed: pvpWinsCount, ...lv };
    })
    .sort((a, b) => b.pvpWins - a.pvpWins || a.username.localeCompare(b.username));

  const soloChampion = topSolo[0] ?? null;
  const pvpChampion = topPvp.find(p => p.pvpWins > 0) ?? null;
  const totalGames = scores.length;
  const totalPvpGames = pvpWins.length;

  return NextResponse.json({
    totalUsers,
    totalGames,
    totalPvpGames,
    topPlayers: topSolo,
    topSolo,
    topPvp,
    champion: soloChampion,
    soloChampion,
    pvpChampion,
  });
}
