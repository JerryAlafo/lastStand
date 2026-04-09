import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserAchievements } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/levelSystem";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const unlockedIds = await getUserAchievements(userId);
  const unlocked = new Set(unlockedIds);

  const result = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlocked.has(a.id),
  }));

  return NextResponse.json({ achievements: result });
}
