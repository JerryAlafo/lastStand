import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getLevelTitle, getLevelColor, getWeekId } from "@/lib/levelSystem";

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  try {
    const supabase = createServiceClient();
    const username = params.username;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Jogador não encontrado." }, { status: 404 });
    }

    const userId = profile.id;

    // Fetch all scores with pagination to avoid 1000 row limit
    let allScores: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: pageScores } = await supabase
        .from("scores")
        .select("*")
        .eq("user_id", userId)
        .order("created_at")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!pageScores || pageScores.length === 0) break;
      allScores = allScores.concat(pageScores);
      if (pageScores.length < pageSize) break;
      page++;
    }

    const [levelResult, achievementsResult, pvpResult, weeklyResult] = await Promise.all([
      supabase.from("user_levels").select("*").eq("user_id", userId).single(),
      supabase.from("achievements").select("achievement_id").eq("user_id", userId),
      supabase.from("pvp_wins").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("weekly_scores").select("score").eq("user_id", userId).eq("week_start", getWeekId()),
    ]);

    const scores = allScores;
    const levelInfo = levelResult.data;
    const achievements = achievementsResult.data || [];
    const pvpWins = pvpResult.count || 0;
    const weeklyScores = weeklyResult.data || [];

    const bestScore = Math.max(0, ...scores.map(s => s.score || 0));
    const bestWave = Math.max(0, ...scores.map(s => s.wave || 0));
    const totalKills = scores.reduce((sum, s) => sum + (s.kills || 0), 0);
    const gamesPlayed = scores.length;
    const weeklyBest = Math.max(0, ...weeklyScores.map(s => s.score || 0));

    const level = levelInfo?.level || 1;
    const totalXp = levelInfo?.total_xp || 0;
    const selectedClass = levelInfo?.selected_class || null;
    const title = getLevelTitle(level);
    const color = getLevelColor(level);

    const scoreHistory = scores.map(s => ({
      score: s.score,
      wave: s.wave,
      kills: s.kills,
      date: s.created_at,
    }));

    return NextResponse.json({
      username,
      level,
      totalXp,
      title,
      color,
      selectedClass,
      bestScore,
      bestWave,
      totalKills,
      gamesPlayed,
      pvpWins,
      weeklyBest,
      achievements: achievements.map(a => a.achievement_id),
      scoreHistory,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Falha ao carregar perfil." }, { status: 500 });
  }
}
