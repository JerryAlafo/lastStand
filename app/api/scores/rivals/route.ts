import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRivalsForUser } from "@/lib/db";
import { getWeekStartDate } from "@/lib/levelSystem";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username as string | undefined;
  if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const mode = (req.nextUrl.searchParams.get("mode") === "weekly" ? "weekly" : "global") as "global" | "weekly";
  const rivals = await getRivalsForUser(username, mode, getWeekStartDate());

  const target = rivals.above;
  const gap = target && rivals.me ? Math.max(0, target.score - rivals.me.score) : null;

  return NextResponse.json({
    ...rivals,
    mode,
    gapToAbove: gap,
    message: target && gap !== null ? `Estás a ${gap} pontos de bater ${target.username}.` : "Já estás no topo desta tabela.",
  });
}
