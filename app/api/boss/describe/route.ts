import { NextResponse } from "next/server";
import { generateBossDescription } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Server-side cache for boss descriptions (persists across requests)
const bossCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bossId = searchParams.get("bossId") || "unknown";
  const bossTheme = searchParams.get("theme") || "sci-fi arena";

  const cached = bossCache.get(bossId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  const description = await generateBossDescription(bossId, bossTheme);

  if (description) {
    bossCache.set(bossId, { data: description, timestamp: Date.now() });
    return NextResponse.json({ ...description, cached: false });
  }

  // Fallback
  const fallback = {
    name: bossId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "Um ser colosal emerge das sombras...",
    lore: "Dizem que este boss ja destruiu civilizacoes inteiras.",
  };
  return NextResponse.json({ ...fallback, cached: false, fallback: true });
}
