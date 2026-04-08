import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    const value = valueParts.join("=").trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

import { createServiceClient } from "../lib/supabase";
import { readUsersLines } from "../lib/fileStore";

async function migrateUsers() {
  console.log("🚀 Starting user migration...\n");

  const supabase = createServiceClient();
  
  // Read existing users from file
  console.log("📁 Reading users from file store...");
  const lines = await readUsersLines();
  console.log(`Found ${lines.length} users in file store\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const line of lines) {
    const parts = line.split("|");
    const [username, hashedPassword, createdAt, userId, ip, userAgent] = parts;

    if (!username || !hashedPassword || !createdAt) {
      console.log(`⚠️  Skipping invalid line: ${line.substring(0, 50)}...`);
      skipped++;
      continue;
    }

    try {
      // Check if user already exists in Supabase
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (existing) {
        console.log(`⏭️  User already exists: ${username}`);
        skipped++;
        continue;
      }

      const profileId = userId || crypto.randomUUID();

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: profileId,
          username,
          created_at: createdAt,
          ip: ip || null,
          user_agent: userAgent || null,
        });

      if (profileError) {
        console.error(`❌ Error creating profile for ${username}: ${profileError.message}`);
        errors++;
        continue;
      }

      // Create user level
      await supabase.from("user_levels").insert({
        user_id: profileId,
        total_xp: 0,
        level: 1,
      });

      // Create legacy user entry with bcrypt hash
      await supabase.from("users_legacy").insert({
        profile_id: profileId,
        username,
        hashed_password: hashedPassword,
        created_at: createdAt,
      });

      console.log(`✅ Migrated: ${username}`);
      migrated++;
    } catch (err) {
      console.error(`❌ Error migrating ${username}:`, err);
      errors++;
    }
  }

  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📝 Total: ${migrated + skipped + errors}`);

  if (errors > 0) {
    console.log("\n⚠️  Some users failed to migrate. Check the errors above.");
  } else {
    console.log("\n🎉 Migration complete!");
  }
}

migrateUsers().catch(console.error);
