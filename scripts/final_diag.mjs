import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const devVarsPath = path.join(process.cwd(), ".dev.vars");
const devVars = fs.readFileSync(devVarsPath, "utf-8");
const getVar = (name) => {
  const line = devVars.split("\n").find((l) => l.trim().startsWith(name + "="));
  return line ? line.split("=").slice(1).join("").trim() : "";
};

const supabaseUrl = getVar("SUPABASE_URL");
const serviceRoleKey = getVar("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("=== PRODUCTION DATABASE STATE ===");
  
  // Check all known tables
  const tablesToCheck = [
    "user_credits", "credit_transactions", "profiles",
    "generation_logs", "generation_cost_config", "idempotency_keys",
    "subscriptions", "plan_allowances", "plan_entitlements",
    "generation_cache", "generation_credit_balances",
  ];

  for (const t of tablesToCheck) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      if (error.message.includes("does not exist") || error.code === "PGRST104") {
        console.log(`  ${t}: MISSING`);
      } else {
        console.log(`  ${t}: ERROR - ${error.message.slice(0, 80)}`);
      }
    } else {
      console.log(`  ${t}: EXISTS (sample row: ${JSON.stringify(data[0] || {}).slice(0, 150)})`);
    }
  }

  // Check user_credits schema
  console.log("\n=== user_credits FULL DATA ===");
  const { data: ucData, error: ucError } = await supabase.from("user_credits").select("*");
  if (ucError) {
    console.log(`  Error: ${ucError.message.slice(0, 100)}`);
  } else {
    console.log(`  Row count: ${ucData.length}`);
    ucData.forEach((r, i) => {
      console.log(`  [${i}] ${JSON.stringify(r)}`);
    });
  }

  // Check credit_transactions
  console.log("\n=== credit_transactions FULL DATA ===");
  const { data: ctData, error: ctError } = await supabase.from("credit_transactions").select("*");
  if (ctError) {
    console.log(`  Error: ${ctError.message.slice(0, 100)}`);
  } else {
    console.log(`  Row count: ${ctData.length}`);
    ctData.slice(0, 5).forEach((r, i) => {
      console.log(`  [${i}] ${JSON.stringify(r)}`);
    });
  }

  // Check profiles
  console.log("\n=== profiles FULL DATA ===");
  const { data: prData, error: prError } = await supabase.from("profiles").select("*");
  if (prError) {
    console.log(`  Error: ${prError.message.slice(0, 100)}`);
  } else {
    console.log(`  Row count: ${prData.length}`);
    prData.forEach((r, i) => {
      console.log(`  [${i}] ${JSON.stringify(r)}`);
    });
  }

  // Check subscriptions
  console.log("\n=== subscriptions FULL DATA ===");
  const { data: subData, error: subError } = await supabase.from("subscriptions").select("*");
  if (subError) {
    console.log(`  Error: ${subError.message.slice(0, 100)}`);
  } else {
    console.log(`  Row count: ${subData.length}`);
    subData.forEach((r, i) => {
      console.log(`  [${i}] ${JSON.stringify(r)}`);
    });
  }

  // Check auth users
  console.log("\n=== AUTH USERS ===");
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log(`  Error: ${authError.message.slice(0, 100)}`);
    } else {
      console.log(`  User count: ${authUsers.length}`);
      authUsers.slice(0, 5).forEach((u) => {
        console.log(`    ${u.id} ${u.email} plan=${u.app_metadata?.plan || "none"}`);
      });
    }
  } catch (e) {
    console.log(`  Exception: ${e.message.slice(0, 100)}`);
  }
}

main().catch(console.error);