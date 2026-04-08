import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserLevel, upsertUserLevel, getProfileByUsername } from "@/lib/db";
import { getLevel, getLevelTitle, getLevelColor, xpForLevel } from "@/lib/levelSystem";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username as string | undefined;
  const userId = token?.userId as string | undefined;
  if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const ul = await getUserLevel(userId);
  const totalXp = ul?.total_xp ?? 0;
  const level   = ul?.level   ?? getLevel(totalXp);
  const selectedClass = ul?.selected_class ?? null;
  const xpThisLevel   = xpForLevel(level);
  const xpNextLevel   = xpForLevel(level + 1);
  return NextResponse.json({
    level, totalXp, selectedClass,
    title: getLevelTitle(level),
    color: getLevelColor(level),
    xpThisLevel, xpNextLevel,
    xpProgress: totalXp - xpThisLevel,
    xpNeeded:   Math.max(1, xpNextLevel - xpThisLevel),
  });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username as string | undefined;
  const userId = token?.userId as string | undefined;
  if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = (await req.json()) as { selectedClass?: string };
  const allowed = ["warrior", "assassin", "mage"];
  if (!body.selectedClass || !allowed.includes(body.selectedClass)) {
    return NextResponse.json({ error: "Classe inválida." }, { status: 400 });
  }

  const ul = await getUserLevel(userId);
  const level = ul?.level ?? 1;
  if (body.selectedClass === "warrior"  && level < 10) return NextResponse.json({ error: "Nível 10 necessário." }, { status: 403 });
  if (body.selectedClass === "assassin" && level < 20) return NextResponse.json({ error: "Nível 20 necessário." }, { status: 403 });
  if (body.selectedClass === "mage"     && level < 30) return NextResponse.json({ error: "Nível 30 necessário." }, { status: 403 });

  await upsertUserLevel({ 
    id: ul?.id || "", 
    user_id: userId, 
    total_xp: ul?.total_xp ?? 0, 
    level, 
    selected_class: body.selectedClass,
    updated_at: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
