import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

interface PushSub {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function getPushSubs(): Promise<PushSub[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("push_subscriptions").select("*");
  return data || [];
}

async function deletePushSubByEndpoint(endpoint: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/** Send a notification to all subscribed users. Stale subs are auto-removed. */
export async function broadcastPush(payload: PushPayload): Promise<void> {
  const subs = await getPushSubs();
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 },
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          await deletePushSubByEndpoint(sub.endpoint).catch(() => undefined);
        }
      }
    }),
  );
}

/** Send a notification to a single user by userId (no-op if not subscribed). */
export async function sendPushToUserById(userId: string, payload: PushPayload): Promise<void> {
  const supabase = createServiceClient();
  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (!sub) return;
  
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 410 || status === 404) {
      await deletePushSubByEndpoint(sub.endpoint).catch(() => undefined);
    }
  }
}
