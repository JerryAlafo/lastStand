import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

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

    const supabase = createServiceClient();

    // First check Supabase profiles for the user
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Utilizador não encontrado." },
        { status: 401 },
      );
    }

    // Verify password using Supabase Admin Auth
    // We need to use a custom verification since we're not using email-based auth
    const { error: signInError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: profile.username + "@laststand.local",
    }).catch(() => ({ error: null }));

    // For legacy users, we'll check against the users_legacy table
    // If not found there, check if this is a Supabase Auth user
    const { data: legacyUser } = await supabase
      .from("users_legacy")
      .select("*")
      .eq("username", username)
      .single();

    if (legacyUser) {
      // Verify bcrypt password
      const bcrypt = require("bcryptjs");
      const isValid = await bcrypt.compare(password, legacyUser.hashed_password);
      
      if (!isValid) {
        return NextResponse.json(
          { error: "Username ou senha inválidos." },
          { status: 401 },
        );
      }

      // Return user data for NextAuth
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

    // If not a legacy user, check if Supabase Auth has this user
    // This requires email-based auth which we haven't fully migrated to
    // For now, return error for non-legacy users
    return NextResponse.json(
      { error: "Por favor, registe-se novamente com esta conta." },
      { status: 401 },
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Login error:", errorMsg);
    return NextResponse.json(
      { error: `Falha ao fazer login: ${errorMsg}` },
      { status: 500 },
    );
  }
}
