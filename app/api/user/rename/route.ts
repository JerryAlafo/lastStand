import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { readUsersLines, getUsersPath } from "@/lib/fileStore";
import fs from "node:fs/promises";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await req.json()) as { newUsername?: string };
  const raw = body.newUsername?.trim() ?? "";
  // Allow letters, numbers, underscores; 3–20 chars
  const clean = raw.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();

  if (clean.length < 3)  return NextResponse.json({ error: "Username deve ter pelo menos 3 caracteres." }, { status: 400 });
  if (clean.length > 20) return NextResponse.json({ error: "Username não pode ter mais de 20 caracteres." }, { status: 400 });

  const current = session.user.username;
  if (clean === current) return NextResponse.json({ error: "É o teu username actual." }, { status: 400 });

  const lines = await readUsersLines();

  if (lines.some((l) => l.split("|")[0].toLowerCase() === clean)) {
    return NextResponse.json({ error: "Username já existe." }, { status: 409 });
  }

  const newLines = lines.map((l) => {
    const parts = l.split("|");
    if (parts[0] === current) {
      parts[0] = clean;
      return parts.join("|");
    }
    return l;
  });

  await fs.writeFile(getUsersPath(), newLines.join("\n") + "\n", "utf-8");
  return NextResponse.json({ ok: true, username: clean });
}
