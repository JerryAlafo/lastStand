import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRoomByToken, upsertRoom } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  const username = token?.username as string | undefined;
  if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const room = await getRoomByToken(params.id);
  if (!room) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });

  if (room.host_id === userId || room.host === username) return NextResponse.json({ room, role: "host" });

  if (room.guest_id && room.guest_id !== userId)
    return NextResponse.json({ error: "Sala já está cheia." }, { status: 409 });

  if (room.status !== "waiting")
    return NextResponse.json({ error: "A partida já começou." }, { status: 409 });

  room.guest_id = userId;
  room.guest = username;
  await upsertRoom(room);
  return NextResponse.json({ room, role: "guest" });
}
