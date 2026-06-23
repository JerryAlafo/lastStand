// Server-only AI module using OpenRouter
// NEVER import this from client-side code

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface TrendAnalysis {
  category: string;
  modalTitle: string;
  modalMessage: string;
  modalIcon: string;
  modalColor: string;
  gameModifier: {
    enemySpeedMult?: number;
    playerDamageMult?: number;
    spawnRateMult?: number;
    xpMult?: number;
    fireBulletsOnly?: boolean;
    noPowerups?: boolean;
  };
}

interface BossDescription {
  name: string;
  description: string;
  lore: string;
}

interface WaveMessage {
  message: string;
}

async function callOpenRouter(messages: ChatMessage[], maxTokens = 300): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://last-stand-arena.vercel.app",
        "X-Title": "Last Stand Arena",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

function parseJsonResponse<T>(text: string): T | null {
  try {
    // Strip markdown code blocks
    let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export async function analyzeTrend(
  trendTitle: string,
  traffic: string
): Promise<TrendAnalysis | null> {
  const result = await callOpenRouter([
    {
      role: "system",
      content: `You are a game event analyzer for a sci-fi arena survival game called "Last Stand Arena".
Analyze the given trending topic and return a JSON object with these fields:
- category: one of "sports", "entertainment", "technology", "gaming", "news" (NEVER use "politics")
- modalTitle: a short exciting title (no emojis, max 5 words, in Portuguese)
- modalMessage: a 1-2 sentence message in Portuguese about how this trend affects the game (no emojis). Be specific about the trend (e.g. mention team names, player names, etc.)
- modalIcon: one of "Trophy", "Clapperboard", "Cpu", "Gamepad2", "BarChart3", "Zap", "Flame"
- modalColor: a hex color code
- gameModifier: object with some of these numeric modifiers: enemySpeedMult (1.0-2.0), playerDamageMult (1.0-2.0), spawnRateMult (1.0-1.5), xpMult (1.0-3.0), plus optional booleans: fireBulletsOnly, noPowerups

IMPORTANT: If the topic is about football/soccer/World Cup, use category "sports" with icon "Trophy" and green color.
Return ONLY the JSON object, no other text.`
    },
    {
      role: "user",
      content: `Trending topic: "${trendTitle}" (traffic: ${traffic})`
    }
  ]);

  if (!result) return null;
  const parsed = parseJsonResponse<TrendAnalysis>(result);
  if (!parsed || !parsed.category || !parsed.modalColor) return null;
  return parsed;
}

export async function generateBossDescription(
  bossName: string,
  bossTheme: string
): Promise<BossDescription | null> {
  const result = await callOpenRouter([
    {
      role: "system",
      content: `You are a creative writer for a sci-fi arena survival game.
Generate a boss description in Portuguese (PT-BR).
Return a JSON object with:
- name: the boss display name (max 25 chars)
- description: one sentence describing the boss's appearance (max 60 chars)
- lore: 1-2 sentences of backstory (max 120 chars)
No emojis. Return ONLY the JSON.`
    },
    {
      role: "user",
      content: `Boss: ${bossName}, Theme: ${bossTheme}`
    }
  ], 200);

  if (!result) return null;
  return parseJsonResponse<BossDescription>(result);
}

export async function generateWaveMessage(
  wave: number,
  playerKills: number,
  playerHp: number
): Promise<WaveMessage | null> {
  const hpContext = playerHp <= 2 ? " The player is at LOW HP - add urgency!" : "";
  const result = await callOpenRouter([
    {
      role: "system",
      content: `You are the hype announcer in a sci-fi arena survival game called "Last Stand Arena".
Generate a short wave announcement in Portuguese (PT-BR).
ALWAYS start with "Wave X - " where X is the wave number, then add your hype text.
Rules:
- Wave 1: "Wave 1 - Prepara-te para a batalha!"
- Waves 2-5: encouraging like "Wave 5 - Nao vao parar!"
- Waves 6-12: intense like "Wave 8 - A arena treme!"
- Waves 13+: dramatic like "Wave 15 - A morte chegou!"
- If player HP is low: add urgency like "Wave 3 - Cuidado, estas fraco!"
- Max 8 words total. No emojis. No period at end.
- Return ONLY a JSON object: {"message":"Wave X - your text here"}`
    },
    {
      role: "user",
      content: `Wave ${wave}, kills so far: ${playerKills}, HP: ${playerHp}/5.${hpContext}`
    }
  ], 100);

  if (!result) return null;
  return parseJsonResponse<WaveMessage>(result);
}

export async function generatePlayerTip(
  playerLevel: number,
  playerClass: string | null,
  bestScore: number,
  currentWave: number
): Promise<string | null> {
  const result = await callOpenRouter([
    {
      role: "system",
      content: `You are a game coach for a sci-fi arena survival game.
Generate a short gameplay tip in Portuguese (PT-BR).
Base it on the player's stats. Max 50 chars, no emojis.
Examples: "Usa Q para esquivar de ataques!", "O escudo e forte contra bosses!"
Return ONLY the tip text, no JSON.`
    },
    {
      role: "user",
      content: `Level: ${playerLevel}, Class: ${playerClass || "none"}, Best score: ${bestScore}, Current wave: ${currentWave}`
    }
  ], 60);

  if (!result) return null;
  return result.replace(/^"|"$/g, "").trim();
}
