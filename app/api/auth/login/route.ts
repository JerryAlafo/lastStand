import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { verifyTurnstileToken } from "@/lib/turnstile";

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string; captchaToken?: string };
    const username = body.username?.trim();
    const password = body.password;
    const captchaToken = body.captchaToken?.trim();

    if (!username || !password || !captchaToken) {
      return NextResponse.json(
        { error: "Username, senha e validação de segurança são obrigatórios." },
        { status: 400 },
      );
    }

    const ip = getClientIp(req);
    const captchaValidation = await verifyTurnstileToken(captchaToken, ip);
    if (!captchaValidation.ok) {
      return NextResponse.json({ error: captchaValidation.error }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 },
      );
    }

    const { data: legacyUser } = await supabase
      .from("users_legacy")
      .select("*")
      .eq("username", username)
      .single();

    if (legacyUser) {
      const bcrypt = require("bcryptjs");
      const isValid = await bcrypt.compare(password, legacyUser.hashed_password);
      
      if (!isValid) {
        return NextResponse.json(
          { error: "Credenciais inválidas." },
          { status: 401 },
        );
      }

      return NextResponse.json({
        ok: true,
        user: {
          id: profile.id,
          userId: profile.id,
          username: profile.username,
          createdAt: profile.created_at,
          ip: profile.ip || "",
          userAgent: profile.user_agent || "",
        },
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email: `${username}@laststand.local`,
        password: password,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: profile.id,
        userId: profile.id,
        username: profile.username,
        createdAt: profile.created_at,
        ip: profile.ip || "",
        userAgent: profile.user_agent || "",
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Credenciais inválidas." },
      { status: 401 },
    );
  }
}
