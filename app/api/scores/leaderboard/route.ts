import { NextResponse } from "next/server";
import { getTopScores } from "@/lib/db";

export async function GET() {
  const scores = await getTopScores(100);

  const formatted = scores.map((s: any) => ({
    username: s.profiles?.username || s.username,
    score: s.score,
    wave: s.wave,
    kills: s.kills,
    date: s.created_at,
  }));

  return NextResponse.json({ scores: formatted });
}

