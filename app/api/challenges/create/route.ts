import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { upsertChallenge } from "@/lib/db";
import { getMapById } from "@/lib/maps";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const username = token?.username as string | undefined;
    const userId = token?.userId as string | undefined;
    if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await req.json();
    const mapId = body?.mapId as string | undefined;
    if (!mapId || !getMapById(mapId)) {
      return NextResponse.json({ error: "Mapa inválido." }, { status: 400 });
    }

    const map = getMapById(mapId)!;
    const tokenId = crypto.randomUUID().split("-")[0];
    const now = Date.now();

    const challenge = {
      id: tokenId,
      token: tokenId,
      creator_id: userId,
      creator: username,
      map_id: mapId,
      map_name: map.namePt,
      seed: map.seed,
      score: 0,
      wave: 0,
      kills: 0,
      target_score: body?.targetScore as number | undefined,
      target_waves: body?.targetWaves as number | undefined,
      target_kills: body?.targetKills as number | undefined,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      status: "active" as const,
    };

    await upsertChallenge(challenge);

    return NextResponse.json({
      ok: true,
      challenge: {
        id: tokenId,
        creator: username,
        mapId: mapId,
        mapName: map.namePt,
        seed: challenge.seed,
        targetScore: challenge.target_score,
        targetWaves: challenge.target_waves,
        targetKills: challenge.target_kills,
        expiresAt: challenge.expires_at,
      },
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ error: "Falha ao criar desafio." }, { status: 500 });
  }
}
