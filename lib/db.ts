import { createServiceClient } from "./supabase";
import type { Challenge, Room, UserLevel } from "./supabase";

const supabase = createServiceClient();

export { Challenge, Room, UserLevel };

// ─────────────────────────────────────────
// PROFILES
// ─────────────────────────────────────────

export async function getProfileByUsername(username: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return data;
}

export async function getProfileById(id: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

// ─────────────────────────────────────────
// SCORES
// ─────────────────────────────────────────

export async function getTopScores(limit = 10) {
  const { data } = await supabase
    .from("scores")
    .select(`
      id,
      score,
      wave,
      kills,
      map_id,
      created_at,
      profiles:user_id (username)
    `)
    .order("score", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getUserScores(userId: string, limit = 10) {
  const { data } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function saveScore(userId: string, score: number, wave: number, kills: number, blastCount: number, mapId: string) {
  const { data, error } = await supabase
    .from("scores")
    .insert({
      user_id: userId,
      score,
      wave,
      kills,
      blast_count: blastCount,
      map_id: mapId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving score:", error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────
// USER LEVELS
// ─────────────────────────────────────────

export async function getUserLevel(userId: string): Promise<UserLevel | null> {
  const { data } = await supabase
    .from("user_levels")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function upsertUserLevel(ul: UserLevel) {
  const { data, error } = await supabase
    .from("user_levels")
    .upsert({
      user_id: ul.user_id,
      total_xp: ul.total_xp,
      level: ul.level,
      selected_class: ul.selected_class,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting user level:", error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────
// ACHIEVEMENTS
// ─────────────────────────────────────────

export async function getUserAchievements(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("achievements")
    .select("achievement_id")
    .eq("user_id", userId);
  return data?.map((a) => a.achievement_id) || [];
}

export async function unlockAchievement(userId: string, achievementId: string) {
  const { error } = await supabase
    .from("achievements")
    .insert({
      user_id: userId,
      achievement_id: achievementId,
    });

  if (error && !error.message.includes("duplicate")) {
    console.error("Error unlocking achievement:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// WEEKLY SCORES
// ─────────────────────────────────────────

export async function getWeeklyScores(weekStart: string, limit = 100) {
  const { data } = await supabase
    .from("weekly_scores")
    .select(`
      id,
      username,
      score,
      week_start,
      profiles:user_id (id)
    `)
    .eq("week_start", weekStart)
    .order("score", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function upsertWeeklyScore(userId: string, username: string, score: number, weekStart: string) {
  const { data, error } = await supabase
    .from("weekly_scores")
    .upsert({
      user_id: userId,
      username,
      score,
      week_start: weekStart,
    }, {
      onConflict: "user_id,week_start",
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting weekly score:", error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────
// DAILY MISSIONS
// ─────────────────────────────────────────

export async function getMissionProgress(userId: string, date: string) {
  const { data } = await supabase
    .from("mission_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date);
  
  const result: Record<string, number> = {};
  data?.forEach((m) => {
    result[m.mission_id] = m.progress;
  });
  return result;
}

export async function upsertMissionProgress(userId: string, date: string, missionId: string, progress: number) {
  const { error } = await supabase
    .from("mission_progress")
    .upsert({
      user_id: userId,
      mission_id: missionId,
      date,
      progress,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error upserting mission progress:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// PVP WINS
// ─────────────────────────────────────────

export async function getPvpWins(userId: string) {
  const { count } = await supabase
    .from("pvp_wins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count || 0;
}

export async function addPvpWin(userId: string) {
  const { error } = await supabase
    .from("pvp_wins")
    .insert({ user_id: userId });

  if (error) {
    console.error("Error adding PVP win:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// PUSH SUBSCRIPTIONS
// ─────────────────────────────────────────

export async function getPushSubscriptions() {
  const { data } = await supabase
    .from("push_subscriptions")
    .select("*");
  return data || [];
}

export async function upsertPushSubscription(userId: string, endpoint: string, p256dh: string, auth: string) {
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({
      user_id: userId,
      endpoint,
      p256dh,
      auth,
    }, {
      onConflict: "user_id,endpoint",
    });

  if (error) {
    console.error("Error upserting push subscription:", error);
    throw error;
  }
}

export async function deletePushSubscription(userId: string) {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting push subscription:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// PUSH META
// ─────────────────────────────────────────

export async function getPushMeta(key: string) {
  const { data } = await supabase
    .from("push_meta")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value;
}

export async function setPushMeta(key: string, value: string) {
  const { error } = await supabase
    .from("push_meta")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) {
    console.error("Error setting push meta:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// CHALLENGES
// ─────────────────────────────────────────

export async function readChallenges(): Promise<Challenge[]> {
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getChallengeByToken(token: string): Promise<Challenge | null> {
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("token", token)
    .single();
  return data;
}

export async function upsertChallenge(ch: Challenge) {
  const { data, error } = await supabase
    .from("challenges")
    .upsert({
      token: ch.token || ch.id,
      creator_id: ch.creator_id,
      creator: ch.creator,
      map_id: ch.map_id,
      map_name: ch.map_name,
      seed: ch.seed,
      score: ch.score,
      wave: ch.wave,
      kills: ch.kills,
      target_score: ch.target_score,
      target_waves: ch.target_waves,
      target_kills: ch.target_kills,
      created_at: ch.created_at,
      expires_at: ch.expires_at,
      status: ch.status,
      completed_by: ch.completed_by,
      completed_by_id: ch.completed_by_id,
    }, {
      onConflict: "token",
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting challenge:", error);
    throw error;
  }
  return data;
}

// ─────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────

export async function getRooms(): Promise<Room[]> {
  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("status", "waiting")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getRoomByToken(token: string): Promise<Room | null> {
  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("token", token)
    .single();
  return data;
}

export async function upsertRoom(room: Room) {
  const { data, error } = await supabase
    .from("rooms")
    .upsert({
      token: room.token || room.id,
      mode: room.mode,
      host_id: room.host_id,
      host: room.host,
      guest_id: room.guest_id,
      guest: room.guest,
      status: room.status,
    }, {
      onConflict: "token",
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting room:", error);
    throw error;
  }
  return data;
}

export async function deleteRoom(token: string) {
  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("token", token);

  if (error) {
    console.error("Error deleting room:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// LEGACY USER MIGRATION
// ─────────────────────────────────────────

export async function migrateLegacyUser(username: string, hashedPassword: string, createdAt: string, userId: string, ip?: string, userAgent?: string) {
  const profileId = userId || crypto.randomUUID();

  // Create profile
  await supabase.from("profiles").insert({
    id: profileId,
    username,
    created_at: createdAt,
    ip: ip || null,
    user_agent: userAgent || null,
  });

  // Create user level
  await supabase.from("user_levels").insert({
    user_id: profileId,
    total_xp: 0,
    level: 1,
  });

  // Create legacy user entry
  await supabase.from("users_legacy").insert({
    profile_id: profileId,
    username,
    hashed_password: hashedPassword,
    created_at: createdAt,
  });

  console.log(`✅ Migrated legacy user: ${username}`);
  return profileId;
}

export async function getLegacyUser(username: string) {
  const { data } = await supabase
    .from("users_legacy")
    .select("*")
    .eq("username", username)
    .single();
  return data;
}

export async function legacyUserExists(username: string) {
  const { data } = await supabase
    .from("users_legacy")
    .select("id", { count: "exact", head: true })
    .eq("username", username)
    .single();
  return data !== null;
}
