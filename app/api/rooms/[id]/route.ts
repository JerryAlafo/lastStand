import { NextRequest, NextResponse } from "next/server";
import { getRoomByToken } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const room = await getRoomByToken(params.id);
  if (!room) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });
  return NextResponse.json({ room });
}
