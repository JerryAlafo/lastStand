import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRoom } from "@/lib/fileStore";
import { getRoomLive, setPlayerLive, addPendingHits, consumePendingHits, type PlayerState } from "@/lib/roomState";

// GET — fetch both players' live states
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const live = getRoomLive(params.id);
  return NextResponse.json({ host: live.host, guest: live.guest });
}

// POST — push my live state; optionally queue hits on the remote player
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const room = await getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });

  const username = token.username as string;
  const role = room.host === username ? "host" : room.guest === username ? "guest" : null;
  if (!role) return NextResponse.json({ error: "Não és membro desta sala." }, { status: 403 });

  const body = (await req.json()) as Partial<PlayerState> & { hitRemote?: number };
  const state: PlayerState = {
    x: Number(body.x ?? 0),
    z: Number(body.z ?? 0),
    angle: Number(body.angle ?? 0),
    hp: Number(body.hp ?? 0),
    score: Number(body.score ?? 0),
    kills: Number(body.kills ?? 0),
    updatedAt: Date.now(),
  };

  setPlayerLive(params.id, role, state);

  // If the sender hit the remote player, queue damage for them
  const hitRemote = Math.min(Number(body.hitRemote ?? 0), 10); // cap per sync to prevent abuse
  if (hitRemote > 0) {
    const remoteRole = role === "host" ? "guest" : "host";
    addPendingHits(params.id, remoteRole, hitRemote);
  }

  // Return live states + any pending hits queued for me by the opponent
  const incomingHits = consumePendingHits(params.id, role);
  const live = getRoomLive(params.id);
  return NextResponse.json({ host: live.host, guest: live.guest, incomingHits });
}
