import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// This endpoint is called internally to migrate users from fileStore to Supabase
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { 
      username?: string; 
      hashedPassword?: string;
      createdAt?: string;
      userId?: string;
      ip?: string;
      userAgent?: string;
    };

    const { username, hashedPassword, createdAt, userId, ip, userAgent } = body;

    if (!username || !hashedPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Check if user already migrated
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existingProfile) {
      return NextResponse.json({ 
        ok: true, 
        message: "User already exists",
        userId: existingProfile.id 
      });
    }

    // Create profile
    const profileId = userId || crypto.randomUUID();
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: profileId,
        username,
        created_at: createdAt || new Date().toISOString(),
        ip: ip || null,
        user_agent: userAgent || null,
      });

    if (profileError && !profileError.message.includes("duplicate")) {
      console.error("Profile error:", profileError);
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 },
      );
    }

    // Create user level
    await supabase
      .from("user_levels")
      .insert({
        user_id: profileId,
        total_xp: 0,
        level: 1,
      });

    // Create legacy user entry
    await supabase
      .from("users_legacy")
      .insert({
        profile_id: profileId,
        username,
        hashed_password: hashedPassword,
        created_at: createdAt || new Date().toISOString(),
      });

    console.log(`✅ Migrated user: ${username}`);
    return NextResponse.json({ ok: true, userId: profileId });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Migration error:", errorMsg);
    return NextResponse.json(
      { error: `Migration failed: ${errorMsg}` },
      { status: 500 },
    );
  }
}

// GET endpoint to migrate all users (call with internal API)
export async function GET() {
  return NextResponse.json({ 
    message: "Use POST to migrate users. Expected body: { username, hashedPassword, createdAt, userId, ip, userAgent }" 
  });
}
