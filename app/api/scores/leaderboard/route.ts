import { NextResponse } from "next/server";
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

export async function GET() {
  const lines = await readScoresLines();
  const rows = lines
    .map(parseScoreLine)
    .filter((r): r is NonNullable<ReturnType<typeof parseScoreLine>> => !!r);

  rows.sort((a, b) => b.score - a.score);
  const top = rows.slice(0, 10).map((r) => ({
    username: r.username,
    score: r.score,
    wave: r.wave,
    kills: r.kills,
    date: new Date(r.timestamp).toISOString(),
  }));

  return NextResponse.json({ scores: top });
}

