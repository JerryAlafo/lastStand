import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { setPushMeta, getPushMeta } from "@/lib/db";
import { sendPushToUserById } from "@/lib/push";

const MIN_INACTIVE_MS = 24 * 60 * 60 * 1000;
const MIN_REMINDER_MS = 48 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const auth = req.headers ? new Headers(req.headers).get("authorization") : null;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = Date.now();

  const { data: subs } = await supabase.from("push_subscriptions").select("user_id");
  const { data: scores } = await supabase
    .from("scores")
    .select("user_id, created_at")
    .order("created_at", { ascending: false });

  const lastPlayed = new Map<string, number>();
  for (const s of scores || []) {
    if (!s.user_id) continue;
    const ts = new Date(s.created_at).getTime();
    if (ts > (lastPlayed.get(s.user_id) ?? 0)) {
      lastPlayed.set(s.user_id, ts);
    }
  }

  const remindedUsers: string[] = [];

  for (const sub of subs || []) {
    if (!sub.user_id) continue;
    
    const lp = lastPlayed.get(sub.user_id) ?? 0;
    const inactiveMs = now - lp;
    if (inactiveMs < MIN_INACTIVE_MS) continue;

    const lastReminder = Number(await getPushMeta(`reminder_${sub.user_id}`) ?? 0);
    if (now - lastReminder < MIN_REMINDER_MS) continue;

    await sendPushToUserById(sub.user_id, {
      title: "Last Stand Arena",
      body: "Os monstros não esperam — volta à arena! O teu record pessoal está à espera de ser batido.",
      url: "/",
      tag: "lsa-reminder",
    });

    await setPushMeta(`reminder_${sub.user_id}`, String(now));
    remindedUsers.push(sub.user_id);
  }

  return NextResponse.json({ ok: true, reminded: remindedUsers.length, users: remindedUsers });
}
