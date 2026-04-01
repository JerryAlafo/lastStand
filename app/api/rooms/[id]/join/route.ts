import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRoom, upsertRoom } from "@/lib/fileStore";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const room = await getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });

  const username = token.username as string;

  // Host re-joining their own room is fine
  if (room.host === username) return NextResponse.json({ room, role: "host" });

  if (room.guest && room.guest !== username)
    return NextResponse.json({ error: "Sala já está cheia." }, { status: 409 });

  if (room.status !== "waiting")
    return NextResponse.json({ error: "A partida já começou." }, { status: 409 });

  room.guest = username;
  await upsertRoom(room);
  return NextResponse.json({ room, role: "guest" });
}
