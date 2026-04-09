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
  if (room.host_id !== userId && room.host !== username)
    return NextResponse.json({ error: "Apenas o criador pode definir o modo." }, { status: 403 });

  const body = (await req.json()) as { mode: "pvp" | "coop" };
  if (!["pvp", "coop"].includes(body.mode))
    return NextResponse.json({ error: "Modo inválido." }, { status: 400 });

  room.mode = body.mode;
  await upsertRoom(room);
  return NextResponse.json({ room });
}
