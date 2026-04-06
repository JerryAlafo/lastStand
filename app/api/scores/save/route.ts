import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  appendScoreLine, readScoresLines, appendWeeklyLine,
  getUserLevel, upsertUserLevel, getUserAchievements, appendAchievementLine,
  upsertMissionProgress, getMissionProgress, readPvpWinsLines,
} from "@/lib/fileStore";
import {
  getLevel, xpForGame, getDailyMissions, getTodayDate,
  getNewAchievements, getWeekId,
} from "@/lib/levelSystem";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const username = token?.username as string | undefined;
    if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = (await req.json()) as { score?: number; wave?: number; kills?: number; blastCount?: number };
    const score      = Number(body.score      ?? 0);
    const wave       = Number(body.wave       ?? 0);
    const kills      = Number(body.kills      ?? 0);
    const blastCount = Number(body.blastCount ?? 0);
    if (!Number.isFinite(score) || !Number.isFinite(wave) || !Number.isFinite(kills)) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    const timestamp = Date.now();
    const today     = getTodayDate();
    const weekId    = getWeekId();

    // 1. Save main score
    await appendScoreLine(`${username}|${score}|${wave}|${kills}|${timestamp}|${blastCount}`);

    // 2. Save weekly score
    await appendWeeklyLine(`${username}|${score}|${wave}|${kills}|${weekId}|${timestamp}`);

    // 3. XP + level
    const xpEarned = xpForGame(score, wave, kills);
    const ul = await getUserLevel(username);
    const prevTotalXp = ul?.totalXp ?? 0;
    const newTotalXp  = prevTotalXp + xpEarned;
    const newLevel    = getLevel(newTotalXp);
    const levelUp     = newLevel > (ul?.level ?? 1);
    await upsertUserLevel({ username, totalXp: newTotalXp, level: newLevel, selectedClass: ul?.selectedClass ?? null });

    // 4. Achievements
    const [allScoreLines, pvpLines, achievedIds] = await Promise.all([
      readScoresLines(), readPvpWinsLines(), getUserAchievements(username),
    ]);
    const userScores = allScoreLines.map(l => l.split("|")).filter(p => p[0] === username);
    const totalKills = userScores.reduce((s, p) => s + (Number(p[3]) || 0), 0);
    const bestScore  = userScores.reduce((s, p) => Math.max(s, Number(p[1]) || 0), 0);
    const maxWave    = userScores.reduce((s, p) => Math.max(s, Number(p[2]) || 0), 0);
    const pvpWins    = pvpLines.filter(l => l.split("|")[0] === username).length;

    const newAchievements = getNewAchievements(
      { totalKills, bestScore, maxWave, level: newLevel, pvpWins },
      { kills, wave, blast: blastCount },
      new Set(achievedIds),
    );
    if (newAchievements.length > 0) {
      await Promise.all(newAchievements.map(id => appendAchievementLine(`${username}|${id}|${timestamp}`)));
    }

    // 5. Mission progress
    const todayMissions = getDailyMissions(today);
    const prevProgress  = await getMissionProgress(username, today);

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
        await upsertMissionProgress(username, today, m.id, newProg);
      }
    }

    return NextResponse.json({
      ok: true,
      xpEarned,
      newLevel,
      levelUp,
      newAchievements,
    });
  } catch {
    return NextResponse.json({ error: "Falha ao salvar score." }, { status: 500 });
  }
}
