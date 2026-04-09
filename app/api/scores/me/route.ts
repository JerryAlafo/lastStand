import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserScores } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const scores = await getUserScores(userId, 50);

  return NextResponse.json({
    scores: scores.map((s) => ({
      username: token.username,
      score: s.score,
      wave: s.wave,
      kills: s.kills,
      blastCount: s.blast_count,
      mapId: s.map_id,
      date: s.created_at,
    })),
  });
}

