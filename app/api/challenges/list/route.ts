import { NextResponse } from "next/server";
import { getActiveChallenges } from "@/lib/db";

export async function GET() {
  try {
    const challenges = await getActiveChallenges();

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error("Error loading challenges:", error);
    return NextResponse.json({ error: "Falha ao carregar desafios." }, { status: 500 });
  }
}
