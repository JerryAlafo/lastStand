import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  saveScore,
  upsertWeeklyScore,
  getUserLevel,
  upsertUserLevel,
  getUserAchievements,
  unlockAchievement,
  upsertMissionProgress,
  getMissionProgress,
  getPvpWins,
  setPushMeta,
  getProfileByUsername,
  getUserScores,
  getTopScores,
  getWeeklyScores,
  getPushMeta,
  updateUserStreak,
  upsertWeeklyEventScore,
} from "@/lib/db";
import {
  getLevel, xpForGame, getDailyMissions, getTodayDate,
  getNewAchievements, getWeekId, getWeekStartDate,
} from "@/lib/levelSystem";
import { broadcastPush } from "@/lib/push";
import { createServiceClient } from "@/lib/supabase";
import { getCurrentWeeklyEvent } from "@/lib/weeklyContent";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const username = token?.username as string | undefined;
    const userId = token?.userId as string | undefined;
    if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = (await req.json()) as { score?: number; wave?: number; kills?: number; blastCount?: number; mapId?: string; eventId?: string };
    const score      = Number(body.score      ?? 0);
    const wave       = Number(body.wave       ?? 0);
    const kills      = Number(body.kills      ?? 0);
    const blastCount = Number(body.blastCount ?? 0);
    const mapId      = body.mapId ?? "arena";
    const eventId    = body.eventId ?? null;
    if (!Number.isFinite(score) || !Number.isFinite(wave) || !Number.isFinite(kills)) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    const today  = getTodayDate();
    const weekId = getWeekId();
    const weekStartDate = getWeekStartDate();

    const event = getCurrentWeeklyEvent();
    const isEventRun = !!(eventId && event.isActive && event.event.id === eventId);

    if (isEventRun) {
      // Event scores are isolated and must never affect global/weekly ladders.
      await upsertWeeklyEventScore(weekStartDate, eventId, userId, username, score);
      return NextResponse.json({
        ok: true,
        eventOnly: true,
        eventId,
      });
    }

    // 1. Save main score
    await saveScore(userId, score, wave, kills, blastCount, mapId);
    const streak = await updateUserStreak(userId, today);

    // 2. Save weekly score
    await upsertWeeklyScore(userId, username, score, weekStartDate);

    // 3. XP + level
    const xpEarned = xpForGame(score, wave, kills);
    const ul = await getUserLevel(userId);
    const prevTotalXp = ul?.total_xp ?? 0;
    const newTotalXp  = prevTotalXp + xpEarned;
    const newLevel    = getLevel(newTotalXp);
    const levelUp     = newLevel > (ul?.level ?? 1);
    await upsertUserLevel({ 
      id: ul?.id || "", 
      user_id: userId, 
      total_xp: newTotalXp, 
      level: newLevel, 
      selected_class: ul?.selected_class ?? null,
      updated_at: new Date().toISOString(),
    });

    // 4. Achievements
    const [achievedIds, pvpWins] = await Promise.all([
      getUserAchievements(userId),
      getPvpWins(userId),
    ]);

    // Get user's stats from scores for achievements (fetch all with pagination to avoid 1000 row limit)
    const supabase = createServiceClient();
    let allUserScores: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: pageScores } = await supabase
        .from("scores")
        .select("*")
        .eq("user_id", userId)
        .order("score", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!pageScores || pageScores.length === 0) break;
      allUserScores = allUserScores.concat(pageScores);
      if (pageScores.length < pageSize) break;
      page++;
    }
    const userScores = allUserScores;
    const totalKills = userScores.reduce((s, p) => s + (p.kills || 0), 0);
    const bestScore  = userScores.reduce((s, p) => Math.max(s, p.score || 0), 0);
    const maxWave    = userScores.reduce((s, p) => Math.max(s, p.wave || 0), 0);

    const newAchievements = getNewAchievements(
      { totalKills, bestScore, maxWave, level: newLevel, pvpWins },
      { kills, wave, blast: blastCount },
      new Set(achievedIds),
    );
    if (newAchievements.length > 0) {
      await Promise.all(newAchievements.map(id => unlockAchievement(userId, id)));
    }

    // 5. Mission progress
    const todayMissions = getDailyMissions(today);
    const prevProgress = await getMissionProgress(userId, today);

    for (const m of todayMissions) {
      let newProg = prevProgress[m.id] ?? 0;
      switch (m.type) {
        case "kills":         newProg = Math.min(m.target, newProg + kills); break;
        case "wave":          newProg = Math.max(newProg, wave >= m.target ? m.target : wave); break;
        case "blast":         newProg = Math.min(m.target, newProg + blastCount); break;
        case "score":         newProg = score >= m.target ? m.target : Math.max(newProg, score); break;
        case "kills_session": newProg = kills >= m.target ? m.target : Math.max(newProg, kills); break;
      }
      if (newProg !== (prevProgress[m.id] ?? 0)) {
        await upsertMissionProgress(userId, today, m.id, newProg);
      }
    }

    // 6. Check for new #1 and broadcast push notification
    try {
      const [globalScores, weeklyScores] = await Promise.all([
        getTopScores(100),
        getWeeklyScores(weekStartDate, 100),
      ]);

      // Handle both old format (username at root) and new format (profiles relation)
      const globalTop = (globalScores[0] as any)?.profiles?.username 
        || (globalScores[0] as any)?.username 
        || "";
      const weeklyTop = weeklyScores[0]?.username ?? "";
      const currentGlobal = await getPushMeta("top1_global") || "";
      const currentWeekly = await getPushMeta("top1_weekly") || "";

      const notifications: Promise<void>[] = [];

      if (globalTop && globalTop !== currentGlobal) {
        await setPushMeta("top1_global", globalTop);
        notifications.push(broadcastPush({
          title: "Novo #1 Global!",
          body: `${globalTop} assumiu o topo do ranking global. Consegues destroná-lo?`,
          url: "/leaderboard",
          tag: "lsa-top1-global",
        }));
      }

      if (weeklyTop && weeklyTop !== currentWeekly) {
        await setPushMeta("top1_weekly", weeklyTop);
        notifications.push(broadcastPush({
          title: "Novo #1 Semanal!",
          body: `${weeklyTop} lidera o ranking desta semana. Entra agora e reage!`,
          url: "/leaderboard",
          tag: "lsa-top1-weekly",
        }));
      }

      await Promise.allSettled(notifications);
    } catch {
      // Push failures must never break score saving
    }

    return NextResponse.json({
      ok: true,
      xpEarned,
      newLevel,
      levelUp,
      newAchievements,
      selectedClass: ul?.selected_class ?? null,
      streak: streak?.current_streak ?? 0,
    });
  } catch (error) {
    console.error("Score save error:", error);
    return NextResponse.json({ error: "Falha ao salvar score." }, { status: 500 });
  }
}
