import fs from "node:fs/promises";
import path from "node:path";

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN ?? process.env.NEXT_GIT_TOKEN ?? "";
const GITHUB_REPO   = process.env.GITHUB_REPO   ?? "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main";
const USE_GITHUB = Boolean(GITHUB_TOKEN && GITHUB_REPO);

const DATA_FILES = {
  users:        "data/users.txt",
  scores:       "data/scores.txt",
  pvpWins:      "data/pvp_wins.txt",
  levels:       "data/levels.txt",
  achievements: "data/achievements.txt",
  weekly:       "data/weekly_scores.txt",
  missions:     "data/missions.txt",
  pushSubs:     "data/push_subscriptions.txt",
  pushMeta:     "data/push_meta.txt",
  challenges:   "data/challenges.txt",
} as const;

type QueueMap = Map<string, Promise<unknown>>;
function getQueues(): QueueMap {
  const g = globalThis as unknown as { __fileStoreQueues?: QueueMap };
  if (!g.__fileStoreQueues) g.__fileStoreQueues = new Map();
  return g.__fileStoreQueues;
}
async function withWriteLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const queues = getQueues();
  const prev   = queues.get(key) ?? Promise.resolve();
  const next   = prev.catch(() => undefined).then(fn);
  queues.set(key, next);
  return next as Promise<T>;
}

type GHFile = { content: string; sha: string };
async function ghGet(filePath: string): Promise<GHFile | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }, cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${filePath} → ${res.status}`);
  const data = (await res.json()) as { content: string; sha: string };
  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
}
async function ghPut(filePath: string, content: string, sha: string | null): Promise<void> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const body: Record<string, unknown> = { message: `data: update ${filePath}`, content: Buffer.from(content, "utf8").toString("base64"), branch: GITHUB_BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub PUT ${filePath} → ${res.status}`);
}

const dataDir = path.join(process.cwd(), "data");
async function ensureLocalFile(p: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  try { await fs.access(p); } catch { await fs.writeFile(p, ""); }
}

async function readLines(filePath: string): Promise<string[]> {
  if (USE_GITHUB) {
    const file = await ghGet(filePath);
    if (!file) return [];
    return file.content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  }
  const lp = path.join(process.cwd(), filePath);
  await ensureLocalFile(lp);
  const raw = await fs.readFile(lp, "utf8");
  return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

async function appendLine(filePath: string, line: string): Promise<void> {
  await withWriteLock(filePath, async () => {
    if (USE_GITHUB) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const file = await ghGet(filePath);
        const existing = file?.content ?? "";
        const newContent = existing === "" || existing.endsWith("\n") ? existing + line + "\n" : existing + "\n" + line + "\n";
        try { await ghPut(filePath, newContent, file?.sha ?? null); return; }
        catch (err) { if (attempt === 0 && err instanceof Error && err.message.includes("409")) continue; throw err; }
      }
    } else {
      const lp = path.join(process.cwd(), filePath);
      await ensureLocalFile(lp);
      await fs.appendFile(lp, `${line}\n`, "utf8");
    }
  });
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await withWriteLock(filePath, async () => {
    if (USE_GITHUB) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const file = await ghGet(filePath);
        try { await ghPut(filePath, content, file?.sha ?? null); return; }
        catch (err) { if (attempt === 0 && err instanceof Error && err.message.includes("409")) continue; throw err; }
      }
    } else {
      const lp = path.join(process.cwd(), filePath);
      await ensureLocalFile(lp);
      await fs.writeFile(lp, content, "utf8");
    }
  });
}

export interface Challenge {
  id: string;
  creator: string;
  mapId: string;
  seed: number;
  score: number;
  wave: number;
  kills: number;
  targetScore?: number;
  targetWaves?: number;
  targetKills?: number;
  createdAt: number;
  expiresAt: number;
  status: "active" | "completed" | "expired";
  completedBy?: string;
}

export async function readChallenges(): Promise<Challenge[]> {
  const lines = await readLines(DATA_FILES.challenges);
  return lines.map(l => {
    try { return JSON.parse(l) as Challenge; } catch { return null; }
  }).filter((c): c is Challenge => !!c);
}

export async function saveChallenges(challenges: Challenge[]): Promise<void> {
  const content = challenges.map(c => JSON.stringify(c)).join("\n") + (challenges.length ? "\n" : "");
  await writeFile(DATA_FILES.challenges, content);
}

export async function upsertChallenge(ch: Challenge): Promise<void> {
  await withWriteLock(DATA_FILES.challenges + ":upsert", async () => {
    const challenges = await readChallenges();
    const idx = challenges.findIndex(c => c.id === ch.id);
    if (idx >= 0) challenges[idx] = ch; else challenges.push(ch);
    await saveChallenges(challenges);
  });
}

export async function getChallenge(id: string): Promise<Challenge | null> {
  const challenges = await readChallenges();
  return challenges.find(c => c.id === id) ?? null;
}

export async function readUsersLines():           Promise<string[]> { return readLines(DATA_FILES.users);       }
export async function appendUserLine(l: string):  Promise<void>     { return appendLine(DATA_FILES.users, l);  }
export async function readScoresLines():          Promise<string[]> { return readLines(DATA_FILES.scores);      }
export async function appendScoreLine(l: string): Promise<void>     { return appendLine(DATA_FILES.scores, l); }
export async function readPvpWinsLines():          Promise<string[]> { return readLines(DATA_FILES.pvpWins);     }
export async function appendPvpWinLine(l: string): Promise<void>     { return appendLine(DATA_FILES.pvpWins, l); }
export async function readLevelsLines():           Promise<string[]> { return readLines(DATA_FILES.levels);      }
export async function appendLevelLine(l: string):  Promise<void>     { return appendLine(DATA_FILES.levels, l);  }
export async function writeLevelsContent(c: string): Promise<void>   { return writeFile(DATA_FILES.levels, c);   }
export async function readAchievementsLines():          Promise<string[]> { return readLines(DATA_FILES.achievements);      }
export async function appendAchievementLine(l: string): Promise<void>     { return appendLine(DATA_FILES.achievements, l);  }
export async function readWeeklyLines():          Promise<string[]> { return readLines(DATA_FILES.weekly);   }
export async function appendWeeklyLine(l: string): Promise<void>    { return appendLine(DATA_FILES.weekly, l); }
export async function readMissionsLines():          Promise<string[]> { return readLines(DATA_FILES.missions);   }
export async function appendMissionLine(l: string): Promise<void>    { return appendLine(DATA_FILES.missions, l); }
export async function writeMissionsContent(c: string): Promise<void> { return writeFile(DATA_FILES.missions, c); }

export interface UserLevel { username: string; totalXp: number; level: number; selectedClass: string | null }
export async function getUserLevel(username: string): Promise<UserLevel | null> {
  const lines = await readLevelsLines();
  for (const l of lines) {
    const [u, xpS, lvS, cls] = l.split("|");
    if (u === username) return { username: u, totalXp: Number(xpS) || 0, level: Number(lvS) || 1, selectedClass: cls || null };
  }
  return null;
}
export async function upsertUserLevel(ul: UserLevel): Promise<void> {
  await withWriteLock(DATA_FILES.levels + ":upsert", async () => {
    const lines = await readLevelsLines();
    const idx = lines.findIndex(l => l.split("|")[0] === ul.username);
    const line = `${ul.username}|${ul.totalXp}|${ul.level}|${ul.selectedClass ?? ""}`;
    if (idx >= 0) lines[idx] = line; else lines.push(line);
    await writeLevelsContent(lines.join("\n") + "\n");
  });
}

export async function getUserAchievements(username: string): Promise<string[]> {
  const lines = await readAchievementsLines();
  return lines.filter(l => l.split("|")[0] === username).map(l => l.split("|")[1]).filter(Boolean);
}

export async function getMissionProgress(username: string, date: string): Promise<Record<string, number>> {
  const lines = await readMissionsLines();
  const result: Record<string, number> = {};
  for (const l of lines) {
    const [u, d, mid, progS] = l.split("|");
    if (u === username && d === date) result[mid] = Number(progS) || 0;
  }
  return result;
}
export async function upsertMissionProgress(username: string, date: string, missionId: string, progress: number): Promise<void> {
  await withWriteLock(DATA_FILES.missions + ":upsert", async () => {
    const lines = await readMissionsLines();
    const key = `${username}|${date}|${missionId}`;
    const idx = lines.findIndex(l => l.startsWith(key + "|"));
    const line = `${key}|${progress}`;
    if (idx >= 0) lines[idx] = line; else lines.push(line);
    await writeMissionsContent(lines.join("\n") + "\n");
  });
}

export interface PushSub { username: string; endpoint: string; p256dh: string; auth: string; subscribedAt: number }
export async function readPushSubs(): Promise<PushSub[]> {
  const lines = await readLines(DATA_FILES.pushSubs);
  return lines.map(l => {
    const [username, endpoint, p256dh, auth, ts] = l.split("|");
    if (!username || !endpoint || !p256dh || !auth) return null;
    return { username, endpoint, p256dh, auth, subscribedAt: Number(ts) || 0 };
  }).filter((s): s is PushSub => !!s);
}
export async function upsertPushSub(sub: PushSub): Promise<void> {
  await withWriteLock(DATA_FILES.pushSubs + ":upsert", async () => {
    const lines = await readLines(DATA_FILES.pushSubs);
    const idx = lines.findIndex(l => l.split("|")[0] === sub.username);
    const line = `${sub.username}|${sub.endpoint}|${sub.p256dh}|${sub.auth}|${sub.subscribedAt}`;
    if (idx >= 0) lines[idx] = line; else lines.push(line);
    const content = lines.join("\n") + "\n";
    if (USE_GITHUB) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const file = await ghGet(DATA_FILES.pushSubs);
        try { await ghPut(DATA_FILES.pushSubs, content, file?.sha ?? null); return; }
        catch (err) { if (attempt === 0 && err instanceof Error && err.message.includes("409")) continue; throw err; }
      }
    } else {
      const lp = path.join(process.cwd(), DATA_FILES.pushSubs);
      await ensureLocalFile(lp); await fs.writeFile(lp, content, "utf8");
    }
  });
}
export async function deletePushSub(username: string): Promise<void> {
  await withWriteLock(DATA_FILES.pushSubs + ":upsert", async () => {
    const lines = await readLines(DATA_FILES.pushSubs);
    const filtered = lines.filter(l => l.split("|")[0] !== username);
    const content = filtered.join("\n") + (filtered.length ? "\n" : "");
    if (USE_GITHUB) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const file = await ghGet(DATA_FILES.pushSubs);
        try { await ghPut(DATA_FILES.pushSubs, content, file?.sha ?? null); return; }
        catch (err) { if (attempt === 0 && err instanceof Error && err.message.includes("409")) continue; throw err; }
      }
    } else {
      const lp = path.join(process.cwd(), DATA_FILES.pushSubs);
      await ensureLocalFile(lp); await fs.writeFile(lp, content, "utf8");
    }
  });
}
export async function readPushMeta(): Promise<Record<string, string>> {
  const lines = await readLines(DATA_FILES.pushMeta);
  const map: Record<string, string> = {};
  for (const l of lines) {
    const [k, ...rest] = l.split("|");
    if (k) map[k] = rest.join("|");
  }
  return map;
}
export async function setPushMeta(key: string, value: string): Promise<void> {
  await withWriteLock(DATA_FILES.pushMeta + ":upsert", async () => {
    const lines = await readLines(DATA_FILES.pushMeta);
    const idx = lines.findIndex(l => l.split("|")[0] === key);
    const line = `${key}|${value}`;
    if (idx >= 0) lines[idx] = line; else lines.push(line);
    const content = lines.join("\n") + "\n";
    if (USE_GITHUB) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const file = await ghGet(DATA_FILES.pushMeta);
        try { await ghPut(DATA_FILES.pushMeta, content, file?.sha ?? null); return; }
        catch (err) { if (attempt === 0 && err instanceof Error && err.message.includes("409")) continue; throw err; }
      }
    } else {
      const lp = path.join(process.cwd(), DATA_FILES.pushMeta);
      await ensureLocalFile(lp); await fs.writeFile(lp, content, "utf8");
    }
  });
}

export function getUsersPath()  { return path.join(dataDir, "users.txt");  }
export function getScoresPath() { return path.join(dataDir, "scores.txt"); }

export interface Room {
  id: string;
  mode: "pvp" | "coop" | null;
  host: string;
  guest: string | null;
  status: "waiting" | "playing" | "finished";
  createdAt: number;
}
export async function readRooms(): Promise<Room[]> {
  const lines = await readLines("data/rooms.txt");
  return lines.map(l => { try { return JSON.parse(l) as Room; } catch { return null; } }).filter((r): r is Room => !!r);
}
export async function saveRooms(rooms: Room[]): Promise<void> {
  await writeFile("data/rooms.txt", rooms.map(r => JSON.stringify(r)).join("\n") + (rooms.length ? "\n" : ""));
}
export async function getRoom(id: string): Promise<Room | null> {
  const rooms = await readRooms();
  return rooms.find(r => r.id === id) ?? null;
}
export async function upsertRoom(room: Room): Promise<void> {
  await withWriteLock("data/rooms.txt:upsert", async () => {
    const rooms = await readRooms();
    const idx = rooms.findIndex(r => r.id === room.id);
    if (idx >= 0) rooms[idx] = room; else rooms.push(room);
    await saveRooms(rooms);
  });
}
