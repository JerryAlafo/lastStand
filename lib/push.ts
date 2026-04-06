import webpush from "web-push";
import { readPushSubs, deletePushSub } from "@/lib/fileStore";

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

/** Send a notification to all subscribed users. Stale subs are auto-removed. */
export async function broadcastPush(payload: PushPayload): Promise<void> {
  const subs = await readPushSubs();
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 }, // 24h TTL
        );
      } catch (err: unknown) {
        // 410 Gone / 404 = subscription expired — clean up
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          await deletePushSub(sub.username).catch(() => undefined);
        }
      }
    }),
  );
}

/** Send a notification to a single user by username (no-op if not subscribed). */
export async function sendPushToUser(username: string, payload: PushPayload): Promise<void> {
  const subs = await readPushSubs();
  const sub = subs.find((s) => s.username === username);
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
      await deletePushSub(username).catch(() => undefined);
    }
  }
}
