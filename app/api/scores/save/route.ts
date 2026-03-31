import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { appendScoreLine } from "@/lib/fileStore";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const username = token?.username;
    if (!username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = (await req.json()) as { score?: number; wave?: number; kills?: number };
    const score = Number(body.score ?? 0);
    const wave = Number(body.wave ?? 0);
    const kills = Number(body.kills ?? 0);
    if (!Number.isFinite(score) || !Number.isFinite(wave) || !Number.isFinite(kills)) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    const timestamp = Date.now();
    const line = `${username}|${score}|${wave}|${kills}|${timestamp}`;
    await appendScoreLine(line);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao salvar score." }, { status: 500 });
  }
}

