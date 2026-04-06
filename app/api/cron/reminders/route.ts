import { NextResponse } from "next/server";
import { readScoresLines, readPushSubs, readPushMeta, setPushMeta } from "@/lib/fileStore";
import { broadcastPush } from "@/lib/push";

// This cron runs every 12 hours (see vercel.json).
// It sends a re-engagement reminder to users who:
//   - Have push subscriptions
//   - Haven't played in >= 24 hours
//   - Haven't received a reminder in the last 48 hours

const MIN_INACTIVE_MS  = 24 * 60 * 60 * 1000;  // 24 h since last game
const MIN_REMINDER_MS  = 48 * 60 * 60 * 1000;  // 48 h between reminders

export async function GET(req: Request) {
  // Validate cron secret (Vercel sets Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers ? new Headers(req.headers).get("authorization") : null;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const [scoreLines, subs, meta] = await Promise.all([
    readScoresLines(),
    readPushSubs(),
    readPushMeta(),
  ]);

  // Build last-played map per user
  const lastPlayed = new Map<string, number>();
  for (const line of scoreLines) {
    const [username, , , , tsS] = line.split("|");
    const ts = Number(tsS) || 0;
    if (username && ts > (lastPlayed.get(username) ?? 0)) {
      lastPlayed.set(username, ts);
    }
  }

  const remindedUsers: string[] = [];

  for (const sub of subs) {
    const lp = lastPlayed.get(sub.username) ?? 0;
    const inactiveMs = now - lp;
    if (inactiveMs < MIN_INACTIVE_MS) continue;  // still active

    const lastReminderKey = `reminder_${sub.username}`;
    const lastReminder = Number(meta[lastReminderKey] ?? 0);
    if (now - lastReminder < MIN_REMINDER_MS) continue;  // reminded too recently

    // Send individual reminder (fire & forget per user, errors swallowed by broadcastPush)
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(sub.username, {
      title: "Last Stand Arena",
      body: "Os monstros não esperam — volta à arena! O teu record pessoal está à espera de ser batido.",
      url: "/",
      tag: "lsa-reminder",
    });

    await setPushMeta(lastReminderKey, String(now));
    remindedUsers.push(sub.username);
  }

  return NextResponse.json({ ok: true, reminded: remindedUsers.length, users: remindedUsers });
}
