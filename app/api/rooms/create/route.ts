import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { upsertRoom, type Room } from "@/lib/fileStore";
import { randomBytes } from "node:crypto";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = randomBytes(3).toString("hex"); // 6-char token
  const room: Room = {
    id,
    mode: null,
    host: token.username as string,
    guest: null,
    status: "waiting",
    createdAt: Date.now(),
  };

  await upsertRoom(room);
  return NextResponse.json({ roomId: id });
}
