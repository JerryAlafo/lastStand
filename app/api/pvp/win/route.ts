import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { appendPvpWinLine } from "@/lib/fileStore";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.username) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const username = token.username as string;
  // Each line: username|timestamp
  await appendPvpWinLine(`${username}|${Date.now()}`);
  return NextResponse.json({ ok: true });
}
