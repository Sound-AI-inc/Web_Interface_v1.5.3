// READ-ONLY post-failure inspection. SELECT statements only — no DDL,
// no writes. Determines what the failed migration run committed.
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const devVars = fs.readFileSync(path.join(process.cwd(), ".dev.vars"), "utf-8");
const getVar = (name) => {
  const line = devVars.split("\n").find((l) => l.trim().startsWith(name + "="));
  return line ? line.split("=").slice(1).join("").trim() : "";
};

const supabase = createClient(getVar("SUPABASE_URL"), getVar("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function tableState(name, cols) {
  const { data, error } = await supabase.from(name).select(cols).limit(100);
  if (error) {
    const msg = error.message.slice(0, 90);
    console.log(`  ${name}: ${/does not exist|PGRST|column/i.test(msg) ? "MISSING-or-NEW-COLS-ABSENT" : "ERROR"} (${msg})`);
    return null;
  }
  return data;
}

async function main() {
  console.log("=== migration_state ===");
  const state = await tableState("credit_engine_migration_state", "step,completed_at");
  if (state) state.forEach((r) => console.log(`  MARKER: ${r.step} @ ${r.completed_at}`));

  console.log("=== user_credits (legacy cols) ===");
  const legacy = await tableState("user_credits", "user_id,current_credits,total_earned_credits");
  if (legacy) {
    console.log(`  rows: ${legacy.length}`);
    legacy.forEach((r) => console.log(`  ${r.user_id} current=${r.current_credits} earned=${r.total_earned_credits}`));
  }

  console.log("=== user_credits (engine cols) ===");
  const engine = await tableState(
    "user_credits",
    "user_id,balance,reserved,plan,monthly_allowance,last_refill_at,next_refill_at,subscription_status",
  );
  if (engine) {
    engine.forEach((r) => console.log(`  ${r.user_id} balance=${r.balance} reserved=${r.reserved} plan=${r.plan} allowance=${r.monthly_allowance}`));
  }

  console.log("=== credit_transactions (legacy cols) ===");
  const txLegacy = await tableState("credit_transactions", "id,transaction_type,amount,description");
  if (txLegacy) console.log(`  rows: ${txLegacy.length}`);

  console.log("=== credit_transactions (engine cols) ===");
  const txEngine = await tableState("credit_transactions", "id,type,balance_after,generation_id,plan,reason");
  if (txEngine) {
    const typed = txEngine.filter((t) => t.type !== null).length;
    const withBal = txEngine.filter((t) => t.balance_after !== null).length;
    console.log(`  rows: ${txEngine.length}, with type=${typed}, with balance_after=${withBal}`);
  }

  console.log("=== engine tables ===");
  for (const t of ["generation_logs", "generation_cache", "idempotency_keys", "subscriptions", "plan_allowances", "plan_entitlements", "generation_cost_config"]) {
    await tableState(t, "id");
    const { error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (!error) {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      console.log(`  ${t}: EXISTS (${count} rows)`);
    }
  }
}

main().catch(console.error);
