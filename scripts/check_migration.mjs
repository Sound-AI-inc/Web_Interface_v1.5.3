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

// ---- text-vs-uuid defect scan on the ACTUAL generated single file ----
let defects = 0;
const fail = (msg) => { console.log("DEFECT:", msg); defects++; };

// 1. No text-cast auth.uid() compared to user_id (uuid columns).
const castCompares = s.match(/auth\.uid\(\)::text\s*=\s*user_id|user_id\s*=\s*auth\.uid\(\)::text/g) || [];
if (castCompares.length) fail(`${castCompares.length}x auth.uid()::text = user_id (text=uuid)`);

// 2. No text-typed p_user_id params remain.
const textParams = s.match(/p_user_id\s+text/g) || [];
if (textParams.length) fail(`${textParams.length}x p_user_id text param (must be uuid)`);

// 3. user_id column defs: uuid everywhere except idempotency_keys (text sentinel).
const colDefs = [...s.matchAll(/^\s*user_id\s+(text|uuid)\b/gm)];
for (const m of colDefs) {
  const idx = s.indexOf(m[0]);
  const lastSource = s.lastIndexOf("SOURCE:", idx);
  const section = s.slice(lastSource, idx).split("\n").pop();
  const inIdem = /idempotency_keys/.test(s.slice(lastSource, idx + 200).split("\n")[0] || "") ||
    /idempotency_keys\.sql/.test(s.slice(lastSource, lastSource + 120));
  if (m[1] === "text" && !inIdem) fail(`text user_id column outside idempotency_keys: "${m[0].trim()}"`);
  if (m[1] === "uuid" && inIdem) fail(`uuid user_id column inside idempotency_keys`);
}

// 4. No FOREIGN KEY / REFERENCES clauses.
const fks = s.match(/references\s+\S+|foreign\s+key/gi) || [];
const fkReal = fks.filter((m) => !/no\s*$/i.test(s.slice(Math.max(0, s.indexOf(m) - 60), s.indexOf(m))) || true);
const fkClauses = [...s.matchAll(/^\s*[^-\n]*\breferences\b[^\n]*/gim)].filter((m) => !m[0].trim().startsWith("--"));
if (fkClauses.length) fail(`FK clause present: ${fkClauses.map((m) => m[0].trim().slice(0, 80)).join(" | ")}`);

// 5. EXECUTE clause order: INTO before USING.
if (/using\s+\S+\s+into\s/i.test(s)) fail("EXECUTE ... USING ... INTO wrong order present");
if (!/into\s+v_trial_expires_at\s+using/i.test(s)) fail("expected EXECUTE ... INTO ... USING not found");

// 6. No bare auth.users.id comparisons (must not appear at all in bundle).
const authRefs = [...s.matchAll(/auth\.users\.id[^\n:]*/g)].filter((m) => !m[0].includes("::text"));
const authCodeRefs = authRefs.filter((m) => {
  const i = s.indexOf(m[0]);
  const lineStart = s.lastIndexOf("\n", i) + 1;
  return !s.slice(lineStart, i).trim().startsWith("--");
});
if (authCodeRefs.length) fail(`bare auth.users.id in code: ${authCodeRefs.map((m) => m[0].slice(0, 60)).join(" | ")}`);

// 7. No trigger NEW/OLD references.
if (/\b(NEW|OLD)\s*\./.test(s)) fail("NEW./OLD. trigger reference present");

// 8. List every user_id comparison for the report.
console.log("--- user_id comparisons in bundle ---");
for (const m of s.matchAll(/^.*user_id.*$/gm)) {
  const line = m[0].trim();
  if (!line.startsWith("--") && /=|<|>/.test(line) && line.length < 160) console.log("  " + line.slice(0, 150));
}

console.log(defects === 0 ? "TYPE-SAFETY SCAN: CLEAN" : `TYPE-SAFETY SCAN: ${defects} DEFECT(S)`);
process.exitCode = defects === 0 ? 0 : 1;
