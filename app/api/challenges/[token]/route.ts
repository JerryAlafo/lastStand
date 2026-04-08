import { NextResponse } from "next/server";
import { getChallengeByToken } from "@/lib/db";
import { getMapById } from "@/lib/maps";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const challenge = await getChallengeByToken(params.token);
    if (!challenge) {
      return NextResponse.json({ error: "Desafio não encontrado." }, { status: 404 });
    }

    if (challenge.status === "expired" || new Date(challenge.expires_at) < new Date()) {
      return NextResponse.json({ error: "Desafio expirado." }, { status: 410 });
    }

    const map = getMapById(challenge.map_id);

    return NextResponse.json({
      challenge: {
        id: challenge.token,
        creator: challenge.creator,
        mapId: challenge.map_id,
        mapName: map?.namePt ?? challenge.map_id,
        seed: challenge.seed,
        score: challenge.score,
        wave: challenge.wave,
        kills: challenge.kills,
        targetScore: challenge.target_score,
        targetWaves: challenge.target_waves,
        targetKills: challenge.target_kills,
        createdAt: challenge.created_at,
        expiresAt: challenge.expires_at,
        status: challenge.status,
        completedBy: challenge.completed_by,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json({ error: "Falha ao carregar desafio." }, { status: 500 });
  }
}
