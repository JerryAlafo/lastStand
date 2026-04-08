import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getChallengeByToken, upsertChallenge } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token_auth = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const username = token_auth?.username as string | undefined;
    const userId = token_auth?.userId as string | undefined;
    if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const challenge = await getChallengeByToken(params.token);
    if (!challenge) {
      return NextResponse.json({ error: "Desafio não encontrado." }, { status: 404 });
    }

    if (challenge.status === "expired" || new Date(challenge.expires_at) < new Date()) {
      return NextResponse.json({ error: "Desafio expirado." }, { status: 410 });
    }

    if (challenge.completed_by && challenge.completed_by !== username) {
      return NextResponse.json({ error: "Este desafio já foi completado por outro jogador." }, { status: 403 });
    }

    if (challenge.creator === username) {
      return NextResponse.json({ error: "Não podes aceitar o teu próprio desafio." }, { status: 400 });
    }

    const body = await req.json();
    const score = Number(body?.score ?? 0);
    const wave = Number(body?.wave ?? 0);
    const kills = Number(body?.kills ?? 0);

    if (!Number.isFinite(score) || !Number.isFinite(wave) || !Number.isFinite(kills)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const hasScoreTarget = challenge.target_score != null && challenge.target_score > 0;
    const hasWaveTarget = challenge.target_waves != null && challenge.target_waves > 0;
    const hasKillsTarget = challenge.target_kills != null && challenge.target_kills > 0;

    if (!hasScoreTarget && !hasWaveTarget && !hasKillsTarget) {
      return NextResponse.json({ ok: true, beatRecord: false, completedAllTargets: false, reason: "no_targets" });
    }

    const metScoreTarget = !hasScoreTarget || score >= challenge.target_score;
    const metWaveTarget = !hasWaveTarget || wave >= challenge.target_waves;
    const metKillsTarget = !hasKillsTarget || kills >= challenge.target_kills;
    const completedAllTargets = metScoreTarget && metWaveTarget && metKillsTarget;

    if (completedAllTargets) {
      const beatRecord = score > challenge.score;
      if (beatRecord) {
        challenge.score = score;
        challenge.wave = wave;
        challenge.kills = kills;
        challenge.status = "completed";
        challenge.completed_by = username;
        challenge.completed_by_id = userId;
        await upsertChallenge(challenge);
      }
      return NextResponse.json({ ok: true, beatRecord, completedAllTargets: true });
    }

    return NextResponse.json({ 
      ok: true, 
      beatRecord: false, 
      completedAllTargets: false,
    });
  } catch (error) {
    console.error("Error submitting challenge:", error);
    return NextResponse.json({ error: "Falha ao submeter desafio." }, { status: 500 });
  }
}
