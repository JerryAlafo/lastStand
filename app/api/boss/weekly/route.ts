import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { claimWeeklyBossKill, getWeeklyBossKill } from "@/lib/db";
import { getWeekStartDate } from "@/lib/levelSystem";
import { getWeeklyBoss } from "@/lib/weeklyContent";
import { generateBossDescription } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Cache for AI boss descriptions (24h)
const descCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET() {
  const weekStart = getWeekStartDate();
  const boss = getWeeklyBoss();
  const kill = await getWeeklyBossKill(weekStart);

  // Try to get AI description for the boss
  let aiDesc: any = null;
  const cached = descCache.get(boss.id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    aiDesc = cached.data;
  } else {
    try {
      const desc = await generateBossDescription(boss.name, boss.id);
      if (desc) {
        aiDesc = desc;
        descCache.set(boss.id, { data: desc, ts: Date.now() });
      }
    } catch {
      // fallback
    }
  }

  return NextResponse.json({
    weekStart,
    boss: {
      ...boss,
      name: aiDesc?.name ?? boss.name,
      description: aiDesc?.description ?? `HP x${boss.hpMult} | Speed x${boss.speedMult}`,
      lore: aiDesc?.lore ?? null,
    },
    defeated: !!kill,
    killer: kill?.killer_username ?? null,
    killedAt: kill?.killed_at ?? null,
  });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  const username = token?.username as string | undefined;
  if (!userId || !username) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const weekStart = getWeekStartDate();
  const boss = getWeeklyBoss();
  const claimed = await claimWeeklyBossKill(weekStart, boss.id, userId, username);
  return NextResponse.json({ ok: true, claimed });
}
