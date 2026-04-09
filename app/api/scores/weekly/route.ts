import { NextResponse } from "next/server";
import { getWeeklyScores } from "@/lib/db";
import { getWeekId, getWeekStartDate } from "@/lib/levelSystem";

export async function GET() {
  const currentWeek = getWeekId();
  const currentWeekStart = getWeekStartDate();
  const scores = await getWeeklyScores(currentWeekStart, 100);

  const formatted = scores.map((s: any, i: number) => ({
    rank: i + 1,
    username: s.username,
    score: s.score,
    weekId: currentWeek,
  }));

  return NextResponse.json({ scores: formatted, weekId: currentWeek });
}
