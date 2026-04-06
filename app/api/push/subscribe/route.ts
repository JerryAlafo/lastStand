import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { upsertPushSub, deletePushSub } from "@/lib/fileStore";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username as string | undefined;
  if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json() as { subscription?: PushSubscriptionJSON; unsubscribe?: boolean };

  if (body.unsubscribe) {
    await deletePushSub(username);
    return NextResponse.json({ ok: true });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Subscription inválida." }, { status: 400 });
  }

  await upsertPushSub({
    username,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    subscribedAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const username = token?.username as string | undefined;
  if (!username) return NextResponse.json({ subscribed: false });

  const { readPushSubs } = await import("@/lib/fileStore");
  const subs = await readPushSubs();
  const subscribed = subs.some((s) => s.username === username);
  return NextResponse.json({ subscribed, publicKey: process.env.VAPID_PUBLIC_KEY ?? "" });
}
