import { NextResponse } from "next/server";
import { readWeeklyLines, readUsersLines } from "@/lib/fileStore";
import { getWeekId } from "@/lib/levelSystem";

export async function GET() {
  const [weeklyLines, userLines] = await Promise.all([readWeeklyLines(), readUsersLines()]);
  const currentWeek = getWeekId();

  // Seed all registered users with 0
  const map = new Map<string, { username: string; score: number; wave: number; kills: number }>();
  for (const l of userLines) {
    const u = l.split("|")[0];
    if (u) map.set(u, { username: u, score: 0, wave: 0, kills: 0 });
  }

  // Override with best score this week
  for (const line of weeklyLines) {
    const [username, scoreS, waveS, killsS, weekId] = line.split("|");
    if (!username || weekId !== currentWeek) continue;
    const score = Number(scoreS), wave = Number(waveS), kills = Number(killsS);
    if (!Number.isFinite(score)) continue;
    const prev = map.get(username);
    if (!prev || score > prev.score) map.set(username, { username, score, wave, kills });
  }

  const top = Array.from(map.values())
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username))
    .map((r, i) => ({ rank: i + 1, ...r, weekId: currentWeek }));

  return NextResponse.json({ scores: top, weekId: currentWeek });
}
