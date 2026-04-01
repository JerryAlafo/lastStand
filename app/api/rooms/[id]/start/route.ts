import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRoom, upsertRoom } from "@/lib/fileStore";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const room = await getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });
  if (room.host !== (token.username as string))
    return NextResponse.json({ error: "Apenas o criador pode iniciar." }, { status: 403 });
  if (!room.guest)
    return NextResponse.json({ error: "Aguardando o convidado entrar." }, { status: 400 });
  if (!room.mode)
    return NextResponse.json({ error: "Seleciona o modo de jogo primeiro." }, { status: 400 });

  room.status = "playing";
  await upsertRoom(room);
  return NextResponse.json({ room });
}
