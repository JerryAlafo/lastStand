import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRoomByToken, upsertRoom, deleteRoom } from "@/lib/db";
import { clearRoomLive } from "@/lib/roomState";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  const username = token?.username as string | undefined;
  if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const room = await getRoomByToken(params.id);
  if (!room) return NextResponse.json({ ok: true });

  if (room.host_id !== userId && room.host !== username && 
      room.guest_id !== userId && room.guest !== username) {
    return NextResponse.json({ error: "Não és membro desta sala." }, { status: 403 });
  }

  room.status = "finished";
  await upsertRoom(room);
  clearRoomLive(params.id);

  return NextResponse.json({ ok: true });
}
