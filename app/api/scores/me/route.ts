import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { readScoresLines } from "@/lib/fileStore";

function parseScoreLine(line: string) {
  const [username, scoreS, waveS, killsS, timestampS] = line.split("|");
  const score = Number(scoreS);
  const wave = Number(waveS);
  const kills = Number(killsS);
  const timestamp = Number(timestampS);
  if (
    !username ||
    !Number.isFinite(score) ||
    !Number.isFinite(wave) ||
    !Number.isFinite(kills) ||
    !Number.isFinite(timestamp)
  ) {
    return null;
  }
  return { username, score, wave, kills, timestamp };
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username;
  if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const lines = await readScoresLines();
  const rows = lines
    .map(parseScoreLine)
    .filter((r): r is NonNullable<ReturnType<typeof parseScoreLine>> => !!r && r.username === username);

  rows.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    scores: rows.map((r) => ({
      username: r.username,
      score: r.score,
      wave: r.wave,
      kills: r.kills,
      date: new Date(r.timestamp).toISOString(),
    })),
  });
}

