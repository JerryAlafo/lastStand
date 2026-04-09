import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { cookies } from "next/headers";

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
          fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}

export function createServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const { createServerClient } = require("@supabase/ssr");
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {}
      },
    },
  });
}

export interface Profile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  ip?: string;
  user_agent?: string;
}

export interface UserLevel {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  selected_class?: string;
  updated_at: string;
}

export interface Score {
  id: string;
  user_id: string;
  score: number;
  wave: number;
  kills: number;
  blast_count: number;
  map_id: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  token: string;
  creator_id?: string;
  creator: string;
  map_id: string;
  map_name?: string;
  seed: number;
  score: number;
  wave: number;
  kills: number;
  target_score?: number;
  target_waves?: number;
  target_kills?: number;
  created_at: string;
  expires_at: string;
  status: "active" | "completed" | "expired";
  completed_by?: string;
  completed_by_id?: string;
}

export interface Room {
  id: string;
  token: string;
  mode: "pvp" | "coop";
  host_id?: string;
  host: string;
  guest_id?: string;
  guest?: string;
  status: "waiting" | "playing" | "finished";
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface MissionProgress {
  id: string;
  user_id: string;
  mission_id: string;
  date: string;
  progress: number;
  updated_at: string;
}

export interface WeeklyScore {
  id: string;
  user_id: string;
  username: string;
  score: number;
  week_start: string;
  created_at: string;
}

export interface PvpWin {
  id: string;
  user_id: string;
  won_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  subscribed_at: string;
}
