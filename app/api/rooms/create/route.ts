import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { upsertRoom } from "@/lib/db";
import type { Room } from "@/lib/supabase";
import { randomBytes } from "node:crypto";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  const username = token?.username as string | undefined;
  if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = randomBytes(3).toString("hex");
  const room: Room = {
    id: id,
    token: id,
    mode: null as any,
    host_id: userId,
    host: username,
    guest_id: null,
    guest: null,
    status: "waiting",
    created_at: new Date().toISOString(),
  };

  await upsertRoom(room);
  return NextResponse.json({ roomId: id });
}
