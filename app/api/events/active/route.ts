import { NextResponse } from "next/server";
import { getCurrentWeeklyEvent } from "@/lib/weeklyContent";
import { getWeeklyEventScores } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = getCurrentWeeklyEvent();
  const leaderboard = current.isActive
    ? await getWeeklyEventScores(current.weekStart, current.event.id, 50)
    : [];
  return NextResponse.json({
    ...current,
    leaderboard,
  });
}
