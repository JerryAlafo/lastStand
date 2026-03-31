import fs from "node:fs/promises";
import path from "node:path";
import { simpleGit, SimpleGit } from "simple-git";

type QueueMap = Map<string, Promise<unknown>>;

let gitInstance: SimpleGit | null = null;

async function getGit(): Promise<SimpleGit> {
  if (!gitInstance) {
    gitInstance = simpleGit(process.cwd());
    // Configure git if running on server
    try {
      await gitInstance.addConfig("user.email", "data-sync@laststandarena.local", false, "local");
      await gitInstance.addConfig("user.name", "Data Sync", false, "local");
      
      // Use git credentials from environment if available
      const token = process.env.GIT_TOKEN || process.env.NEXT_GIT_TOKEN;
      if (token) {
        try {
          const repoUrl = await gitInstance.getConfig("remote.origin.url");
          if (repoUrl && typeof repoUrl.value === "string") {
            const httpsUrl = repoUrl.value.replace("git@github.com:", "https://github.com/");
            const credentialsUrl = httpsUrl.replace("https://github.com/", `https://x-access-token:${token}@github.com/`);
            await gitInstance.addConfig("remote.origin.url", credentialsUrl, false, "local");
            console.log("✅ Git credentials configured");
          }
        } catch (e) {
          console.warn("Failed to setup git credentials:", e);
          if (process.env.VERCEL === "1") {
            throw new Error("Cannot configure git credentials on Vercel - data will be lost!");
          }
        }
      } else if (process.env.VERCEL === "1") {
        throw new Error("GIT_TOKEN or NEXT_GIT_TOKEN not set in Vercel environment!");
      }
    } catch (e) {
      console.error("Git config error:", e);
      if (process.env.VERCEL === "1") {
        throw e;
      }
    }
  }
  return gitInstance;
}

async function commitAndPushToGit(filePath: string): Promise<void> {
  if (process.env.DISABLE_GIT_SYNC === "1") {
    console.warn(`Git sync disabled explicitly for '${filePath}'`);
    return;
  }

  const isServerless = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless && !process.env.GIT_TOKEN && !process.env.NEXT_GIT_TOKEN) {
    console.warn(`Serverless environment without git token: cleanup + sync skipped for '${filePath}'`);
    return;
  }

  try {
    const git = await getGit();
    const relativePath = path.relative(process.cwd(), filePath);

    try {
      await git.status();
    } catch (e) {
      if (process.env.VERCEL === "1") {
        throw new Error("Not in a git repository on Vercel - data would be lost!");
      }
      console.warn("Not in a git repository locally, skipping git sync");
      return;
    }

    await git.add(relativePath);
    const timestamp = new Date().toISOString();
    await git.commit(`Update ${relativePath} - ${timestamp}`);

    try {
      await git.push();
      console.log(`✅ Pushed ${relativePath} to git`);
    } catch (pushError) {
      if (process.env.VERCEL === "1") {
        throw new Error(`Failed to push to git on Vercel: ${pushError instanceof Error ? pushError.message : pushError}`);
      }
      console.warn("Push failed (may be offline or no remote):", pushError instanceof Error ? pushError.message : pushError);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ CRITICAL Git sync error:", errorMsg);

    if (process.env.VERCEL === "1") {
      throw error;
    }

    console.warn("Git sync failed locally (non-critical):", errorMsg);
  }
}

function getQueues(): QueueMap {
  const g = globalThis as unknown as { __fileStoreQueues?: QueueMap };
  if (!g.__fileStoreQueues) g.__fileStoreQueues = new Map();
  return g.__fileStoreQueues;
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureFile(filePath: string) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "");
  }
}

async function withFileWriteLock<T>(filePath: string, fn: () => Promise<T>) {
  const queues = getQueues();
  const prev = queues.get(filePath) ?? Promise.resolve();
  const safePrev = prev.catch(() => undefined);
  const next = safePrev.then(fn);
  queues.set(filePath, next);
  return next as Promise<T>;
}

const gitDataDir = path.join(process.cwd(), "data");
const isServerless = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const dataDir =
  process.env.DATA_DIR ||
  process.env.GIT_DATA_DIR ||
  (isServerless ? "/tmp/data" : gitDataDir);
const usersPath = path.join(dataDir, "users.txt");
const scoresPath = path.join(dataDir, "scores.txt");

export async function readUsersLines(): Promise<string[]> {
  await ensureDir(dataDir);
  await ensureFile(usersPath);
  const content = await fs.readFile(usersPath, "utf8");
  return content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

export async function appendUserLine(line: string): Promise<void> {
  await withFileWriteLock(usersPath, async () => {
    await ensureDir(dataDir);
    await ensureFile(usersPath);
    await fs.appendFile(usersPath, `${line}\n`, "utf8");
    await commitAndPushToGit(usersPath);
  });
}

export async function readScoresLines(): Promise<string[]> {
  await ensureDir(dataDir);
  await ensureFile(scoresPath);
  const content = await fs.readFile(scoresPath, "utf8");
  return content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

export async function appendScoreLine(line: string): Promise<void> {
  await withFileWriteLock(scoresPath, async () => {
    await ensureDir(dataDir);
    await ensureFile(scoresPath);
    await fs.appendFile(scoresPath, `${line}\n`, "utf8");
    await commitAndPushToGit(scoresPath);
  });
}

export function getUsersPath() {
  return usersPath;
}

export function getScoresPath() {
  return scoresPath;
}

