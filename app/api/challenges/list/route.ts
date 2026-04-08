import { NextResponse } from "next/server";
import { readChallenges } from "@/lib/fileStore";

export async function GET() {
  try {
    const challenges = await readChallenges();
    const now = Date.now();
    const active = challenges
      .filter(c => c.status === "active" && now < c.expiresAt)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);

    const activeWithStatus = active.map(c => ({
      ...c,
      isCompleted: !!c.completedBy,
    }));

    return NextResponse.json({ challenges: activeWithStatus });
  } catch {
    return NextResponse.json({ error: "Falha ao carregar desafios." }, { status: 500 });
  }
}
