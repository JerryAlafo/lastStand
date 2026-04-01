import { NextResponse } from "next/server";
import { readUsersLines, readScoresLines } from "@/lib/fileStore";

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
  const [userLines, scoreLines] = await Promise.all([readUsersLines(), readScoresLines()]);

  // Seed every registered user with a zero entry
  const map = new Map<string, { username: string; score: number; wave: number; kills: number; date: string }>();
  for (const line of userLines) {
    const username = line.split("|")[0];
    if (username) map.set(username, { username, score: 0, wave: 0, kills: 0, date: "" });
  }

  // Override with best score per player from scores.txt
  const rows = scoreLines.map(parseScoreLine).filter((r): r is NonNullable<ReturnType<typeof parseScoreLine>> => !!r);
  for (const r of rows) {
    const prev = map.get(r.username);
    if (!prev || r.score > prev.score) {
      map.set(r.username, { username: r.username, score: r.score, wave: r.wave, kills: r.kills, date: new Date(r.timestamp).toISOString() });
    }
  }

  const top = Array.from(map.values())
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username))
    .slice(0, 10);

  return NextResponse.json({ scores: top });
}

