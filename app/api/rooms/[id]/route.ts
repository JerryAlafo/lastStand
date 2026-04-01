import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/lib/fileStore";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const room = await getRoom(params.id);
  if (!room) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });
  return NextResponse.json({ room });
}
