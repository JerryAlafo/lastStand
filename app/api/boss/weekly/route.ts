import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { claimWeeklyBossKill, getWeeklyBossKill } from "@/lib/db";
import { getWeekStartDate } from "@/lib/levelSystem";
import { getWeeklyBoss } from "@/lib/weeklyContent";

export const dynamic = "force-dynamic";

export async function GET() {
  const weekStart = getWeekStartDate();
  const boss = getWeeklyBoss();
  const kill = await getWeeklyBossKill(weekStart);
  return NextResponse.json({
    weekStart,
    boss,
    defeated: !!kill,
    killer: kill?.killer_username ?? null,
    killedAt: kill?.killed_at ?? null,
  });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  const username = token?.username as string | undefined;
  if (!userId || !username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const weekStart = getWeekStartDate();
  const boss = getWeeklyBoss();
  const claimed = await claimWeeklyBossKill(weekStart, boss.id, userId, username);
  return NextResponse.json({ ok: true, claimed });
}
