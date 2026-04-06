import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserLevel, upsertUserLevel } from "@/lib/fileStore";
import { getLevel, getLevelTitle, getLevelColor, xpForLevel } from "@/lib/levelSystem";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username as string | undefined;
  if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const ul = await getUserLevel(username);
  const totalXp = ul?.totalXp ?? 0;
  const level   = ul?.level   ?? getLevel(totalXp);
  const selectedClass = ul?.selectedClass ?? null;
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
  if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = (await req.json()) as { selectedClass?: string };
  const allowed = ["warrior", "assassin", "mage"];
  if (!body.selectedClass || !allowed.includes(body.selectedClass)) {
    return NextResponse.json({ error: "Classe inválida." }, { status: 400 });
  }

  const ul = await getUserLevel(username);
  const level = ul?.level ?? 1;
  if (body.selectedClass === "warrior"  && level < 10) return NextResponse.json({ error: "Nível 10 necessário." }, { status: 403 });
  if (body.selectedClass === "assassin" && level < 20) return NextResponse.json({ error: "Nível 20 necessário." }, { status: 403 });
  if (body.selectedClass === "mage"     && level < 30) return NextResponse.json({ error: "Nível 30 necessário." }, { status: 403 });

  await upsertUserLevel({ username, totalXp: ul?.totalXp ?? 0, level, selectedClass: body.selectedClass });
  return NextResponse.json({ ok: true });
}
