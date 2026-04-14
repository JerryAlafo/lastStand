-- Retention and engagement features

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_played_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_event_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start DATE NOT NULL,
  event_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.weekly_boss_kills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  boss_id TEXT NOT NULL,
  killer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  killer_username TEXT NOT NULL,
  killed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_best ON public.user_streaks(best_streak DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_event_scores_lookup ON public.weekly_event_scores(week_start, event_id, score DESC);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_event_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_boss_kills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage streaks" ON public.user_streaks
  FOR ALL USING (true);

CREATE POLICY "Anyone can view weekly event scores" ON public.weekly_event_scores
  FOR SELECT USING (true);
CREATE POLICY "Service can manage weekly event scores" ON public.weekly_event_scores
  FOR ALL USING (true);

CREATE POLICY "Anyone can view weekly boss kills" ON public.weekly_boss_kills
  FOR SELECT USING (true);
CREATE POLICY "Service can manage weekly boss kills" ON public.weekly_boss_kills
  FOR ALL USING (true);

CREATE POLICY "Service can manage weekly email logs" ON public.weekly_email_logs
  FOR ALL USING (true);
