/**
 * WODO Ally - Auth Setup Script
 *
 * Run AFTER you have executed supabase/migrations/001_schema.sql
 * and supabase/seed.sql in the Supabase SQL Editor.
 *
 * Usage:
 *   node scripts/setup-auth.mjs
 *
 * This script:
 *   1. Creates the accounts@wodo.digital user in Supabase Auth
 *   2. Creates the admin profile in the profiles table
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local if present
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {
  // .env.local not found - rely on existing env vars
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Make sure .env.local has:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL");
  console.error("  SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const ADMIN_EMAIL = "accounts@wodo.digital";
const ADMIN_PASSWORD = "WodoAlly@2026!"; // Change after first login

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("WODO Ally - Auth Setup");
  console.log("======================\n");

  // Step 1: Create auth user
  console.log(`Creating auth user: ${ADMIN_EMAIL}`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // skip email verification
  });

  if (authError) {
    if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
      console.log("User already exists in Auth - fetching existing user...");
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find((u) => u.email === ADMIN_EMAIL);
      if (existingUser) {
        await ensureProfile(existingUser.id, existingUser.email);
      }
    } else {
      console.error("Error creating auth user:", authError.message);
      process.exit(1);
    }
    return;
  }

  console.log(`Auth user created: ${authData.user.id}`);

  // Step 2: Create admin profile
  await ensureProfile(authData.user.id, ADMIN_EMAIL);
}

async function ensureProfile(userId, email) {
  console.log(`\nCreating admin profile for: ${email}`);

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (existing) {
    if (existing.role !== "admin") {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);
      if (error) {
        console.error("Error updating role:", error.message);
      } else {
        console.log("Profile role updated to admin.");
      }
    } else {
      console.log("Profile already exists with admin role.");
    }
    return;
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    full_name: "Shyam Singh Bhati",
    email: email,
    role: "admin",
  });

  if (profileError) {
    console.error("Error creating profile:", profileError.message);
    console.log("\nNOTE: If you get an RLS error, make sure you ran 001_schema.sql first.");
    process.exit(1);
  }

  console.log("Admin profile created successfully.");
  console.log("\n======================");
  console.log("Setup complete!");
  console.log(`Email   : ${ADMIN_EMAIL}`);
  console.log(`Password: WodoAlly@2026!`);
  console.log("\nChange your password after first login.");
  console.log("======================\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
