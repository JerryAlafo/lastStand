import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { readUsersLines, appendUserLine } from "@/lib/fileStore";

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password;
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username e senha são obrigatórios." },
        { status: 400 },
      );
    }

    const users = await readUsersLines();
    const exists = users.some((l) => l.split("|")[0] === username);
    if (exists) {
      return NextResponse.json({ error: "Este username já existe." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const userId = randomUUID();
    const ip = getClientIp(req);
    // Sanitise userAgent: strip pipes so file format stays intact
    const ua = (req.headers.get("user-agent") ?? "unknown").replace(/\|/g, ";").slice(0, 250);

    const line = `${username}|${hashedPassword}|${createdAt}|${userId}|${ip}|${ua}`;
    console.log(`📝 Registering user: ${username}`);
    await appendUserLine(line);
    console.log(`✅ User registered successfully: ${username}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Register error:", errorMsg);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: `Falha ao registrar: ${errorMsg}` }, 
      { status: 500 }
    );
  }
}

