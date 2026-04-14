import { NextResponse } from "next/server";
import { getTopScores, getTopStreaks } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [scores, streaks] = await Promise.all([getTopScores(100), getTopStreaks(200)]);
  const streakMap = new Map<string, number>();
  for (const s of streaks as any[]) {
    const username = s.profiles?.username;
    if (username) streakMap.set(username, s.current_streak ?? 0);
  }

  const formatted = scores.map((s: any) => ({
    username: s.profiles?.username || s.username,
    score: s.score,
    wave: s.wave,
    kills: s.kills,
    date: s.created_at,
    streak: streakMap.get(s.profiles?.username || s.username) ?? 0,
  }));

  return NextResponse.json({ scores: formatted });
}

