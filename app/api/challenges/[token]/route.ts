import { NextResponse } from "next/server";
import { getChallenge } from "@/lib/fileStore";
import { getMapById } from "@/lib/maps";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const challenge = await getChallenge(params.token);
    if (!challenge) {
      return NextResponse.json({ error: "Desafio não encontrado." }, { status: 404 });
    }

    if (challenge.status === "expired" || Date.now() > challenge.expiresAt) {
      return NextResponse.json({ error: "Desafio expirado." }, { status: 410 });
    }

    const map = getMapById(challenge.mapId);

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        creator: challenge.creator,
        mapId: challenge.mapId,
        mapName: map?.namePt ?? challenge.mapId,
        seed: challenge.seed,
        score: challenge.score,
        wave: challenge.wave,
        kills: challenge.kills,
        createdAt: challenge.createdAt,
        expiresAt: challenge.expiresAt,
        status: challenge.status,
      },
    });
  } catch {
    return NextResponse.json({ error: "Falha ao carregar desafio." }, { status: 500 });
  }
}
