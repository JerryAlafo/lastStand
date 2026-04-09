import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  const currentUsername = token?.username as string | undefined;
  if (!userId || !currentUsername) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await req.json()) as { newUsername?: string };
  const raw = body.newUsername?.trim() ?? "";
  const clean = raw.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();

  if (clean.length < 3) return NextResponse.json({ error: "Username deve ter pelo menos 3 caracteres." }, { status: 400 });
  if (clean.length > 20) return NextResponse.json({ error: "Username não pode ter mais de 20 caracteres." }, { status: 400 });
  if (clean === currentUsername) return NextResponse.json({ error: "É o teu username actual." }, { status: 400 });

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", clean)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Username já existe." }, { status: 409 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: clean })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "Falha ao atualizar username." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username: clean });
}
