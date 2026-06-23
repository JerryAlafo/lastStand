import { NextResponse } from "next/server";
import { generatePlayerTip } from "@/lib/ai";

export const dynamic = "force-dynamic";

const tipCache = new Map<string, { tip: string; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function POST(request: Request) {
  try {
    const { level, cls, bestScore, wave } = await request.json();

    const key = `l${level}_c${cls || "n"}_s${bestScore}_w${wave}`;
    const cached = tipCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ tip: cached.tip, cached: true });
    }

    const tip = await generatePlayerTip(level ?? 1, cls ?? null, bestScore ?? 0, wave ?? 1);

    if (tip) {
      tipCache.set(key, { tip, timestamp: Date.now() });
      return NextResponse.json({ tip, cached: false });
    }

    // Fallback tips
    const fallbacks = [
      "Usa Q para esquivar!",
      "Escolhe upgrades com cuidado!",
      "O dash tem cooldown, usa com parcimonia!",
      "Inimigos tanque sao lentos, foca neles!",
      "O blast e forte contra grupos!",
    ];
    return NextResponse.json({ tip: fallbacks[Math.floor(Math.random() * fallbacks.length)], fallback: true });
  } catch {
    return NextResponse.json({ tip: "Sobrevive!", fallback: true });
  }
}
