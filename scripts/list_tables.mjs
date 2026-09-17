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

async function query(table, select = "*", limit = 10) {
  const { data, error } = await supabase.from(table).select(select).limit(limit);
  if (error) {
    return { error: error.message.slice(0, 150) };
  }
  return { data, count: data.length };
}

async function main() {
  // List all tables by trying common table names
  const tablesToCheck = [
    "user_credits", "credit_transactions", "profiles",
    "generation_logs", "generation_cost_config", "idempotency_keys",
    "subscriptions", "plan_allowances", "plan_entitlements",
    "generation_cache", "generation_credit_balances",
    "users", "auth_users", "auth_sessions",
    "generation_jobs", "model_registry", "generation_requests",
    "billing_events", "payment_orders",
    "api_keys", "rate_limits", "audit_logs",
    "system_config", "generation_stats",
    "user_subscriptions", "user_plans", "user_entitlements",
    "credit_ledger", "credit_balances",
  ];

  console.log("=== Checking all tables ===");
  const existing = [];
  for (const t of tablesToCheck) {
    const result = await query(t, "*", 1);
    if (result.error && (result.error.includes("does not exist") || result.error.includes("PGRST104"))) {
      // table doesn't exist
    } else {
      existing.push({ name: t, ...result });
    }
  }

  for (const t of existing) {
    console.log(`  ${t.name}: ${t.count} rows`);
    if (t.data && t.data.length > 0) {
      console.log(`    Sample: ${JSON.stringify(t.data[0]).slice(0, 200)}`);
    }
  }

  // Check user_credits full schema
  console.log("\n=== user_credits full data ===");
  const uc = await query("user_credits", "*", 5);
  if (uc.data) {
    uc.data.forEach((r, i) => console.log(`  [${i}] ${JSON.stringify(r)}`));
  }

  // Check credit_transactions
  console.log("\n=== credit_transactions ===");
  const ct = await query("credit_transactions", "*", 3);
  if (ct.data) {
    ct.data.forEach((r, i) => console.log(`  [${i}] ${JSON.stringify(r)}`));
  }

  // Check profiles
  console.log("\n=== profiles ===");
  const pr = await query("profiles", "*", 3);
  if (pr.data) {
    pr.data.forEach((r, i) => console.log(`  [${i}] ${JSON.stringify(r)}`));
  }

  // Check subscriptions
  console.log("\n=== subscriptions ===");
  const sub = await query("subscriptions", "*", 3);
  if (sub.data) {
    sub.data.forEach((r, i) => console.log(`  [${i}] ${JSON.stringify(r)}`));
  }

  // Check auth users
  console.log("\n=== auth.users ===");
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log(`  Error: ${authError.message.slice(0, 100)}`);
    } else {
      console.log(`  Users: ${authUsers.length}`);
      authUsers.slice(0, 5).forEach((u) => console.log(`    ${u.id} ${u.email} plan=${u.app_metadata?.plan || "none"}`));
    }
  } catch (e) {
    console.log(`  Exception: ${e.message.slice(0, 100)}`);
  }
}

main().catch(console.error);