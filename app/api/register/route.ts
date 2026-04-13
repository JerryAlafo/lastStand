import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { verifyTurnstileToken } from "@/lib/turnstile";

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string; email?: string; captchaToken?: string };
    const username = body.username?.trim();
    const password = body.password;
    const email = body.email || `${username}@laststand.local`;
    const captchaToken = body.captchaToken?.trim();
    
    if (!username || !password || !captchaToken) {
      return NextResponse.json(
        { error: "Username, senha e validação de segurança são obrigatórios." },
        { status: 400 },
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username deve ter entre 3 e 20 caracteres." },
        { status: 400 },
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 4 caracteres." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const ip = getClientIp(req);
    const userAgent = (req.headers.get("user-agent") ?? "unknown").slice(0, 250);
    const captchaValidation = await verifyTurnstileToken(captchaToken, ip);
    if (!captchaValidation.ok) {
      return NextResponse.json({ error: captchaValidation.error }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "Este username já existe." }, { status: 409 });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
      },
    });

    if (authError) {
      console.error("❌ Supabase Auth error:", authError.message);
      return NextResponse.json(
        { error: `Falha ao registrar: ${authError.message}` },
        { status: 500 },
      );
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          username: username,
          ip,
          user_agent: userAgent,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }

      const { data: existingLevel } = await supabase
        .from("user_levels")
        .select("user_id")
        .eq("user_id", authData.user.id)
        .single();

      if (!existingLevel) {
        await supabase.from("user_levels").upsert({
          user_id: authData.user.id,
          total_xp: 0,
          level: 1,
        });
      }
    }

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

