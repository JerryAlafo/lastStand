import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { addPvpWin } from "@/lib/db";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  await addPvpWin(userId);
  return NextResponse.json({ ok: true });
}
