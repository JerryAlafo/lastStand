-- Supabase Database Schema for Last Stand Arena
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Legacy users table (for migrating existing users)
CREATE TABLE IF NOT EXISTS public.users_legacy (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for legacy users
CREATE INDEX IF NOT EXISTS idx_users_legacy_username ON public.users_legacy(username);

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT
);

-- User levels and XP
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  selected_class TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  kills INTEGER NOT NULL,
  blast_count INTEGER DEFAULT 0,
  map_id TEXT DEFAULT 'arena',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly scores (for leaderboard)
CREATE TABLE IF NOT EXISTS public.weekly_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Daily missions progress
CREATE TABLE IF NOT EXISTS public.mission_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mission_id TEXT NOT NULL,
  date DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mission_id, date)
);

-- PVP wins
CREATE TABLE IF NOT EXISTS public.pvp_wins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  won_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Push meta
CREATE TABLE IF NOT EXISTS public.push_meta (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator TEXT NOT NULL,
  map_id TEXT NOT NULL,
  map_name TEXT,
  seed INTEGER NOT NULL,
  score INTEGER DEFAULT 0,
  wave INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0,
  target_score INTEGER,
  target_waves INTEGER,
  target_kills INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  completed_by TEXT,
  completed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Rooms (for multiplayer)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  mode TEXT DEFAULT 'pvp',
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  host TEXT NOT NULL,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_week ON public.weekly_scores(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_score ON public.weekly_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_token ON public.challenges(token);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_rooms_token ON public.rooms(token);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- Row Level Security (RLS) - Enable for security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can view profiles (for leaderboards)
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

-- User levels policies
CREATE POLICY "Users can view own level" ON public.user_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own level" ON public.user_levels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level" ON public.user_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scores policies
CREATE POLICY "Anyone can view scores" ON public.scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores" ON public.scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weekly scores policies
CREATE POLICY "Anyone can view weekly scores" ON public.weekly_scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own weekly scores" ON public.weekly_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly scores" ON public.weekly_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mission progress policies
CREATE POLICY "Users can view own missions" ON public.mission_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own missions" ON public.mission_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions" ON public.mission_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PVP wins policies
CREATE POLICY "Anyone can view PVP wins" ON public.pvp_wins
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own PVP wins" ON public.pvp_wins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Push meta policies
CREATE POLICY "Anyone can view push meta" ON public.push_meta
  FOR SELECT USING (true);

CREATE POLICY "Service can manage push meta" ON public.push_meta
  FOR ALL USING (true);

-- Challenges policies
CREATE POLICY "Anyone can view active challenges" ON public.challenges
  FOR SELECT USING (status = 'active' OR status = 'completed');

CREATE POLICY "Authenticated users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own challenges" ON public.challenges
  FOR UPDATE USING (creator_id = auth.uid() OR completed_by_id = auth.uid());

-- Rooms policies
CREATE POLICY "Anyone can view active rooms" ON public.rooms
  FOR SELECT USING (status = 'waiting');

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Hosts can update their rooms" ON public.rooms
  FOR UPDATE USING (host_id = auth.uid());

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NOW());
  INSERT INTO public.user_levels (user_id, total_xp, level)
  VALUES (NEW.id, 0, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  username TEXT,
  score INTEGER,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY s.score DESC)::BIGINT as rank,
    p.username,
    s.score,
    COALESCE(ul.level, 1)::INTEGER as level
  FROM public.scores s
  JOIN public.profiles p ON s.user_id = p.id
  LEFT JOIN public.user_levels ul ON ul.user_id = p.id
  ORDER BY s.score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
