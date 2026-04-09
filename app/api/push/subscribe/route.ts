import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { upsertPushSubscription, deletePushSubscription } from "@/lib/db";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json() as { subscription?: PushSubscriptionJSON; unsubscribe?: boolean };

  if (body.unsubscribe) {
    await deletePushSubscription(userId);
    return NextResponse.json({ ok: true });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Subscription inválida." }, { status: 400 });
  }

  await upsertPushSubscription(
    userId,
    sub.endpoint,
    sub.keys.p256dh,
    sub.keys.auth,
  );

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  if (!userId) return NextResponse.json({ subscribed: false });

  const { createServiceClient } = await import("@/lib/supabase");
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("endpoint")
    .eq("user_id", userId)
    .single();
  
  return NextResponse.json({ subscribed: !!data, publicKey: process.env.VAPID_PUBLIC_KEY ?? "" });
}
