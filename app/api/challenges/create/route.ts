import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { upsertChallenge } from "@/lib/fileStore";
import { getMapById } from "@/lib/maps";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const username = token?.username as string | undefined;
    if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await req.json();
    const mapId = body?.mapId as string | undefined;
    if (!mapId || !getMapById(mapId)) {
      return NextResponse.json({ error: "Mapa inválido." }, { status: 400 });
    }

    const map = getMapById(mapId)!;
    const id = crypto.randomUUID().split("-")[0];
    const now = Date.now();

    const challenge = {
      id,
      creator: username,
      mapId,
      seed: map.seed,
      score: 0,
      wave: 0,
      kills: 0,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
      status: "active" as const,
    };

    await upsertChallenge(challenge);

    return NextResponse.json({
      ok: true,
      challenge: {
        id: challenge.id,
        creator: challenge.creator,
        mapId: challenge.mapId,
        seed: challenge.seed,
        expiresAt: challenge.expiresAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Falha ao criar desafio." }, { status: 500 });
  }
}
