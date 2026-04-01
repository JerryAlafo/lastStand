import fs from "node:fs/promises";
import path from "node:path";

// ── Config ───────────────────────────────────────────────────────────────────
// Production (Vercel): set these env vars in the Vercel dashboard:
//   GITHUB_TOKEN  — Personal Access Token with "repo" (read+write contents) scope
//   GITHUB_REPO   — e.g. "jerry/last-stand-arena"
//   GITHUB_BRANCH — optional, defaults to "main"
//
// Development: falls back to local filesystem (data/ folder) as before.

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN ?? process.env.NEXT_GIT_TOKEN ?? "";
const GITHUB_REPO   = process.env.GITHUB_REPO   ?? "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main";

const USE_GITHUB = Boolean(GITHUB_TOKEN && GITHUB_REPO);

const DATA_FILES = {
  users:   "data/users.txt",
  scores:  "data/scores.txt",
  pvpWins: "data/pvp_wins.txt",
} as const;

// ── Write-lock queue (serialises concurrent writes per file) ─────────────────
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

// ── GitHub REST API helpers ───────────────────────────────────────────────────

type GHFile = { content: string; sha: string };

async function ghGet(filePath: string): Promise<GHFile | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${filePath} → ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: string; sha: string };
  return {
    content: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha,
  };
}

async function ghPut(filePath: string, content: string, sha: string | null): Promise<void> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const body: Record<string, unknown> = {
    message: `data: update ${filePath}`,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch:  GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${filePath} → ${res.status}: ${await res.text()}`);
}

// ── Local filesystem helpers (development) ────────────────────────────────────

const dataDir = path.join(process.cwd(), "data");

async function ensureLocalFile(p: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  try { await fs.access(p); } catch { await fs.writeFile(p, ""); }
}

// ── Core read / append ────────────────────────────────────────────────────────

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
      // Read current content + SHA, append line, write back.
      // Retry once on 409 Conflict (two Vercel instances racing on the same SHA).
      for (let attempt = 0; attempt < 2; attempt++) {
        const file       = await ghGet(filePath);
        const existing   = file?.content ?? "";
        const newContent = existing === "" || existing.endsWith("\n")
          ? existing + line + "\n"
          : existing + "\n" + line + "\n";
        try {
          await ghPut(filePath, newContent, file?.sha ?? null);
          return;
        } catch (err) {
          if (attempt === 0 && err instanceof Error && err.message.includes("409")) continue;
          throw err;
        }
      }
    } else {
      const lp = path.join(process.cwd(), filePath);
      await ensureLocalFile(lp);
      await fs.appendFile(lp, `${line}\n`, "utf8");
    }
  });
}

// ── Core full-file write (replaces entire content) ───────────────────────────

async function writeFile(filePath: string, content: string): Promise<void> {
  await withWriteLock(filePath, async () => {
    if (USE_GITHUB) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const file = await ghGet(filePath);
        try {
          await ghPut(filePath, content, file?.sha ?? null);
          return;
        } catch (err) {
          if (attempt === 0 && err instanceof Error && err.message.includes("409")) continue;
          throw err;
        }
      }
    } else {
      const lp = path.join(process.cwd(), filePath);
      await ensureLocalFile(lp);
      await fs.writeFile(lp, content, "utf8");
    }
  });
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

const ROOMS_FILE = "data/rooms.txt";

export interface Room {
  id: string;                      // 6-char hex token — also the invite token
  mode: "pvp" | "coop" | null;
  host: string;
  guest: string | null;
  status: "waiting" | "playing" | "finished";
  createdAt: number;
}

export async function readRooms(): Promise<Room[]> {
  const lines = await readLines(ROOMS_FILE);
  return lines.map(l => { try { return JSON.parse(l) as Room; } catch { return null; } })
    .filter((r): r is Room => !!r);
}

export async function saveRooms(rooms: Room[]): Promise<void> {
  const content = rooms.map(r => JSON.stringify(r)).join("\n") + (rooms.length ? "\n" : "");
  await writeFile(ROOMS_FILE, content);
}

export async function getRoom(id: string): Promise<Room | null> {
  const rooms = await readRooms();
  return rooms.find(r => r.id === id) ?? null;
}

export async function upsertRoom(room: Room): Promise<void> {
  await withWriteLock(ROOMS_FILE + ":upsert", async () => {
    const rooms = await readRooms();
    const idx = rooms.findIndex(r => r.id === room.id);
    if (idx >= 0) rooms[idx] = room; else rooms.push(room);
    await saveRooms(rooms);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function readUsersLines():           Promise<string[]> { return readLines(DATA_FILES.users);       }
export async function appendUserLine(l: string):  Promise<void>     { return appendLine(DATA_FILES.users, l);  }
export async function readScoresLines():          Promise<string[]> { return readLines(DATA_FILES.scores);      }
export async function appendScoreLine(l: string): Promise<void>     { return appendLine(DATA_FILES.scores, l); }
export async function readPvpWinsLines():         Promise<string[]> { return readLines(DATA_FILES.pvpWins);     }
export async function appendPvpWinLine(l: string):Promise<void>     { return appendLine(DATA_FILES.pvpWins, l);}

export function getUsersPath()  { return path.join(dataDir, "users.txt");  }
export function getScoresPath() { return path.join(dataDir, "scores.txt"); }
