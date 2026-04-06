import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getMissionProgress } from "@/lib/fileStore";
import { getDailyMissions, getTodayDate } from "@/lib/levelSystem";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username as string | undefined;
  if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const today    = getTodayDate();
  const missions = getDailyMissions(today);
  const progress = await getMissionProgress(username, today);

  const result = missions.map(m => ({
    ...m,
    progress: progress[m.id] ?? 0,
    completed: (progress[m.id] ?? 0) >= m.target,
  }));

  return NextResponse.json({ missions: result, date: today });
}
