import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string; email?: string };
    const username = body.username?.trim();
    const password = body.password;
    const email = body.email || `${username}@laststand.local`;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username e senha são obrigatórios." },
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

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "Este username já existe." }, { status: 409 });
    }

    // Create user in Supabase Auth
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

    // Update profile with additional info
    if (authData.user) {
      await supabase
        .from("profiles")
        .update({
          ip,
          user_agent: userAgent,
        })
        .eq("id", authData.user.id);
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

