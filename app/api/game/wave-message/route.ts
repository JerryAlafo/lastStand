import { NextResponse } from "next/server";
import { generateWaveMessage } from "@/lib/ai";

export const dynamic = "force-dynamic";

const waveCache = new Map<string, { msg: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function POST(request: Request) {
  let wave = 1;
  try {
    const body = await request.json();
    wave = body.wave ?? 1;
    const kills = body.kills ?? 0;
    const hp = body.hp ?? 5;

    const key = `w${wave}_k${kills}_hp${hp}`;
    const cached = waveCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ message: cached.msg, cached: true });
    }

    const result = await generateWaveMessage(wave, kills, hp);

    if (result?.message) {
      waveCache.set(key, { msg: result.message, timestamp: Date.now() });
      return NextResponse.json({ message: result.message, cached: false });
    }

    const fallbackMsg = wave <= 1
      ? "Wave 1 - Prepara-te!"
      : wave <= 5
      ? `Wave ${wave} - Nao vao parar!`
      : wave <= 12
      ? `Wave ${wave} - A arena treme!`
      : `Wave ${wave} - A morte chegou!`;

    return NextResponse.json({ message: fallbackMsg, fallback: true });
  } catch {
    return NextResponse.json({ message: `Wave ${wave} - Sobrevive!`, fallback: true });
  }
}
