import { NextResponse } from "next/server";
import { getCachedTrends, detectTrendEvents } from "@/lib/trends";
import { analyzeTrend } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Cache for AI-analyzed trends (server-side, 1 hour TTL)
let aiCache: { data: any; timestamp: number } | null = null;
const AI_CACHE_TTL = 60 * 60 * 1000;

export async function GET() {
  const trends = await getCachedTrends();
  const fallbackEvents = detectTrendEvents(trends);

  // Try AI analysis if cache is cold
  let events = fallbackEvents;
  const cacheValid = aiCache && Date.now() - aiCache.timestamp < AI_CACHE_TTL;

  if (!cacheValid && trends.length > 0) {
    const topTrends = trends.slice(0, 5);

    // Analyze top trends in parallel (max 3 to control cost)
    const analyses = await Promise.allSettled(
      topTrends.slice(0, 3).map(async (t) => {
        const ai = await analyzeTrend(t.title, t.traffic);
        return {
          id: `trend_${t.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50)}`,
          trendTitle: t.title,
          category: ai?.category ?? "other",
          modalTitle: ai?.modalTitle ?? "Tendencia Detectada!",
          modalMessage: ai?.modalMessage ?? `Topico em alta: "${t.title}"`,
          modalIcon: ai?.modalIcon ?? "Flame",
          modalColor: ai?.modalColor ?? "#e74c3c",
          gameModifier: ai?.gameModifier ?? { xpMult: 2 },
        };
      })
    );

    const aiEvents = analyses
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);

    if (aiEvents.length > 0) {
      events = aiEvents;
      aiCache = { data: events, timestamp: Date.now() };
    }
  } else if (cacheValid && aiCache) {
    events = aiCache.data;
  }

  return NextResponse.json({
    trends: trends.slice(0, 20).map((t) => ({
      title: t.title,
      traffic: t.traffic,
      pubDate: t.pubDate,
    })),
    events,
    aiPowered: !!aiCache,
    timestamp: new Date().toISOString(),
  });
}
