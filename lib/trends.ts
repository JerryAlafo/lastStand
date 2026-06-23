// Google Trends integration — detects trending topics and maps them to in-game events

export interface TrendTopic {
  title: string;
  traffic: string;
  pubDate: string;
  link: string;
}

export interface TrendEvent {
  id: string;
  trendTitle: string;
  category: TrendCategory;
  modalTitle: string;
  modalMessage: string;
  modalIcon: TrendIconName;
  modalColor: string;
  gameModifier?: GameModifier;
}

export type TrendCategory =
  | "sports"
  | "entertainment"
  | "technology"
  | "gaming"
  | "politics"
  | "news"
  | "other";

export type TrendIconName =
  | "Trophy"
  | "Clapperboard"
  | "Cpu"
  | "Gamepad2"
  | "BarChart3"
  | "Zap"
  | "Flame"
  | "TrendingUp";

export interface GameModifier {
  enemySpeedMult?: number;
  playerDamageMult?: number;
  spawnRateMult?: number;
  xpMult?: number;
  fireBulletsOnly?: boolean;
  noPowerups?: boolean;
}

// Keyword → category mapping
const CATEGORY_KEYWORDS: Record<TrendCategory, string[]> = {
  sports: [
    "copa", "world cup", "futebol", "football", "soccer", "champions",
    "league", "premier", "liga", "jogos olímpicos", "olympics", "nba",
    "nfl", "ufc", "formula 1", "f1", "tênis", "tenis", "atletismo",
    "gol", "goal", "mundial", "euro", "brasileirão", "serie a",
    "world", "cup", "mundial", "copa do mundo", "seleção", "selecao",
    "brasil", "brazil", "portugal", "argentina", "messi", "neymar",
    "mbappe", "haaland", "vinicius", "rodrygo", "palmeiras", "flamengo",
    "corinthians", "são paulo", "botafogo", "fortaleza", "maracanã",
    "final", "semifinal", "quartas", "oitavas", "eliminatória",
  ],
  entertainment: [
    "film", "movie", "filme", "série", "series", "netflix", "disney",
    "anime", "manga", "marvel", "dc", "star wars", "concert", "show",
    "festival", "grammy", "oscar", "emmy", "taylor swift", "bad bunny",
    "drake", "billie", "música", "musica", "álbum", "album",
    "première", "estreia", "trailer", "season", "temporada",
    "avatar", "barbie", "oppenheimer", "dune", "gta", "gta 6",
    "cyberpunk", "zelda", "mario", "fortnite", "valorant",
  ],
  technology: [
    "ai", "inteligência artificial", "artificial intelligence",
    "chatgpt", "openai", "google", "apple", "iphone", "android",
    "tesla", "spacex", "elon musk", "meta", "facebook", "instagram",
    "tiktok", "x", "twitter", "blockchain", "cripto", "crypto",
    "bitcoin", "nft", "cloud", "5g", "quantum", "robô", "robot",
    "software", "hardware", "chip", "gpu", "nvidia", "amd", "intel",
    "startup", "unicorn", "cybersecurity", "hack", "data",
  ],
  gaming: [
    "game", "jogo", "gamer", "esports", "e-sports", "steam",
    "playstation", "xbox", "nintendo", "switch", "ps5", "pc",
    "valorant", "lol", "league of legends", "fortnite", "apex",
    "cod", "call of duty", "counter-strike", "cs2", "pubg",
    "minecraft", "roblox", "gta", "zelda", "mario", "pokemon",
    "elden ring", "dark souls", "diablo", "overwatch", "genshin",
    "stream", "twitch", "yt", "youtube", "tiktok",
  ],
  politics: [
    "eleição", "election", "presidente", "president", "governo",
    "government", "senado", "deputado", "congresso", "vote",
    "voto", "urna", "campanha", "partido", "ministro", "lei",
    "law", "reforma", "impeach", "democracia", "liberdade",
  ],
  news: [
    "terremoto", "earthquake", "tsunami", "furacão", "hurricane",
    "incêndio", "fire", "enchente", "flood", "covid", "vacina",
    "vaccine", "pandemia", "pandemic", "guerra", "war", "conflict",
    "crise", "crisis", "protesto", "protest", "greve", "strike",
    "acidente", "desastre", "desastre natural",
  ],
  other: [],
};

// Category → game event template
const EVENT_TEMPLATES: Record<TrendCategory, Omit<TrendEvent, "id" | "trendTitle">> = {
  sports: {
    category: "sports",
    modalTitle: "Tendencia Detectada!",
    modalMessage: "O mundo esta falando de esportes! Bonus de XP ativo durante esta sessao.",
    modalIcon: "Trophy",
    modalColor: "#2ecc71",
    gameModifier: { xpMult: 1.5 },
  },
  entertainment: {
    category: "entertainment",
    modalTitle: "Tendencia Detectada!",
    modalMessage: "A internet esta falando de entretenimento! Inimigos aparecem mais frequentemente, mas dropam mais power-ups.",
    modalIcon: "Clapperboard",
    modalColor: "#e74c3c",
    gameModifier: { spawnRateMult: 1.3 },
  },
  technology: {
    category: "technology",
    modalTitle: "Tendencia Detectada!",
    modalMessage: "Tecnologia esta em alta! Dano das balas aumentado nesta sessao.",
    modalIcon: "Cpu",
    modalColor: "#3498db",
    gameModifier: { playerDamageMult: 1.5 },
  },
  gaming: {
    category: "gaming",
    modalTitle: "Tendencia Detectada!",
    modalMessage: "Gaming esta dominando! Inimigos 25% mais rapidos, mas XP duplicado!",
    modalIcon: "Gamepad2",
    modalColor: "#9b59b6",
    gameModifier: { enemySpeedMult: 1.25, xpMult: 2 },
  },
  politics: {
    category: "politics",
    modalTitle: "Tendencia Detectada!",
    modalMessage: "O mundo esta em ebulicao! Sobreviva ao caos - dano aumentado em 50%.",
    modalIcon: "BarChart3",
    modalColor: "#f39c12",
    gameModifier: { playerDamageMult: 1.5 },
  },
  news: {
    category: "news",
    modalTitle: "Tendencia Detectada!",
    modalMessage: "Eventos globais em alta! Sem power-ups nesta sessao, mas recompensas triplicadas.",
    modalIcon: "Zap",
    modalColor: "#e67e22",
    gameModifier: { noPowerups: true, xpMult: 3 },
  },
  other: {
    category: "other",
    modalTitle: "Tendencia Detectada!",
    modalMessage: "Algo grande esta acontecendo! Bonus de 2x XP ativo.",
    modalIcon: "Flame",
    modalColor: "#e74c3c",
    gameModifier: { xpMult: 2 },
  },
};

function classifyTopic(title: string): TrendCategory {
  const lower = title.toLowerCase();
  let bestCategory: TrendCategory = "other";
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TrendCategory, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length; // longer keyword matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  return bestCategory;
}

function buildEventId(title: string): string {
  return "trend_" + title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
}

export function detectTrendEvents(trends: TrendTopic[]): TrendEvent[] {
  const seen = new Set<string>();
  const events: TrendEvent[] = [];

  for (const trend of trends) {
    const category = classifyTopic(trend.title);
    if (category === "other") continue; // only create events for classified trends

    const id = buildEventId(trend.title);
    if (seen.has(id)) continue;
    seen.add(id);

    const template = EVENT_TEMPLATES[category];
    events.push({
      id,
      trendTitle: trend.title,
      ...template,
      modalMessage: `${template.modalMessage}\n\nTopico: "${trend.title}"`,
    });
  }

  // Return at most 3 events
  return events.slice(0, 3);
}

// Fetch trending topics from Google Trends RSS (Brazil)
export async function fetchGoogleTrends(): Promise<TrendTopic[]> {
  try {
    const res = await fetch(
      "https://trends.google.com/trending/rss?geo=BR",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 }, // cache 1 hour
      }
    );

    if (!res.ok) return [];

    const xml = await res.text();
    return parseTrendsXml(xml);
  } catch {
    return [];
  }
}

function parseTrendsXml(xml: string): TrendTopic[] {
  const items: TrendTopic[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const traffic = extractTag(block, "ht:approx_traffic");
    const pubDate = extractTag(block, "pubDate");
    const link = extractTag(block, "link");

    if (title) {
      items.push({ title, traffic: traffic || "0", pubDate: pubDate || "", link: link || "" });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.trim() || "";
}

// Cache for trends (in-memory, server-side)
let trendsCache: { data: TrendTopic[]; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getCachedTrends(): Promise<TrendTopic[]> {
  if (trendsCache && Date.now() - trendsCache.timestamp < CACHE_TTL) {
    return trendsCache.data;
  }
  const trends = await fetchGoogleTrends();
  trendsCache = { data: trends, timestamp: Date.now() };
  return trends;
}
