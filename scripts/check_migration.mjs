// Validates the generated production migration: balanced dollar-quoting,
// required objects present, no destructive DDL.
import * as fs from "fs";
import * as path from "path";

const file = path.join(process.cwd(), "supabase", "schema", "credit_engine_production_migration.sql");
const s = fs.readFileSync(file, "utf-8");

const markers = s.match(/\$\$/g) || [];
console.log("dollar-quote markers:", markers.length, markers.length % 2 === 0 ? "(balanced OK)" : "(UNBALANCED!)");

const required = [
  "credit_engine_migration_state", "user_credits_user_id_uidx", "current_credits",
  "generation_logs", "generation_cache", "idempotency_keys", "subscriptions",
  "plan_allowances", "plan_entitlements", "generation_cost_config",
  "reserve_credits", "consume_credits", "restore_credits", "grant_credits",
  "refill_credits", "get_generation_cost", "BACKFILL_MISMATCH", "grant_reference",
  "INVALID_AMOUNT", "CONSUME_AMOUNT_MISMATCH", "TRIAL_EXPIRED", "REFILL_NOT_DUE",
];
let missing = 0;
for (const t of required) {
  if (!s.includes(t)) { console.log("MISSING:", t); missing++; }
}
console.log(missing === 0 ? "all required markers present" : `${missing} MISSING`);

const destructive = s.match(/drop\s+(column|table)|truncate\s+table|delete\s+from/gi) || [];
console.log("destructive statements:", destructive.length === 0 ? "none OK" : JSON.stringify(destructive));

// Order check: state -> wallet cols -> backfill -> unique -> tx cols -> history -> tables -> costs -> RPCs
const orderKeys = [
  "credit_engine_migration_state (",
  "user_credits_backfill",
  "user_credits_unique_user_id",
  "credit_transactions_history_mapped",
  "SOURCE: generation_logs.sql",
  "SOURCE: idempotency_keys.sql",
  "SOURCE: subscriptions.sql",
  "SOURCE: plan_allowances.sql",
  "SOURCE: plan_entitlements.sql",
  "SOURCE: generation_cost_config.sql",
];
let lastIdx = -1, orderOk = true;
for (const k of orderKeys) {
  const i = s.indexOf(k);
  if (i < 0) { console.log("ORDER KEY NOT FOUND:", k); orderOk = false; break; }
  if (i < lastIdx) { console.log("ORDER VIOLATION at:", k); orderOk = false; break; }
  lastIdx = i;
}
console.log(orderOk ? "step order OK" : "step order BROKEN");
