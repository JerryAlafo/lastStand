import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRoom, upsertRoom } from "@/lib/fileStore";
import { clearRoomLive } from "@/lib/roomState";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const room = await getRoom(params.id);
  if (!room) return NextResponse.json({ ok: true }); // already gone

  const username = token.username as string;
  if (room.host !== username && room.guest !== username) {
    return NextResponse.json({ error: "Não és membro desta sala." }, { status: 403 });
  }

  // Mark room as finished and clear in-memory live state
  await upsertRoom({ ...room, status: "finished" });
  clearRoomLive(params.id);

  return NextResponse.json({ ok: true });
}
