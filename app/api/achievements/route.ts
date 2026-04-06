import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserAchievements } from "@/lib/fileStore";
import { ACHIEVEMENTS } from "@/lib/levelSystem";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username as string | undefined;
  if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const unlockedIds = await getUserAchievements(username);
  const unlocked = new Set(unlockedIds);

  const result = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlocked.has(a.id),
  }));

  return NextResponse.json({ achievements: result });
}
