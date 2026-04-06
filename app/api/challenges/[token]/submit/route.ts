import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getChallenge, upsertChallenge } from "@/lib/fileStore";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token_auth = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const username = token_auth?.username as string | undefined;
    if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const challenge = await getChallenge(params.token);
    if (!challenge) {
      return NextResponse.json({ error: "Desafio não encontrado." }, { status: 404 });
    }

    if (challenge.status === "expired" || Date.now() > challenge.expiresAt) {
      return NextResponse.json({ error: "Desafio expirado." }, { status: 410 });
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

    if (score > challenge.score) {
      challenge.score = score;
      challenge.wave = wave;
      challenge.kills = kills;
      challenge.status = "completed";
      await upsertChallenge(challenge);
    }

    return NextResponse.json({ ok: true, beatRecord: score > 0 });
  } catch {
    return NextResponse.json({ error: "Falha ao submeter desafio." }, { status: 500 });
  }
}
