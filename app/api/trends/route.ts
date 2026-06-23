import { NextResponse } from "next/server";
import { getCachedTrends, detectTrendEvents } from "@/lib/trends";

export const dynamic = "force-dynamic";

export async function GET() {
  const trends = await getCachedTrends();
  const events = detectTrendEvents(trends);

  // Return top raw trends + mapped game events
  return NextResponse.json({
    trends: trends.slice(0, 20).map((t) => ({
      title: t.title,
      traffic: t.traffic,
      pubDate: t.pubDate,
    })),
    events,
    timestamp: new Date().toISOString(),
  });
}
