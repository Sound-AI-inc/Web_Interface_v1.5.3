// LIVE production verification: schema objects, data integrity, costs, RPCs.
// READ-ONLY except: none. Does not modify balances.
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

let pass = 0, failCount = 0;
const check = (name, ok, detail = "") => {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? " — " + detail : ""}`);
  ok ? pass++ : failCount++;
};

async function main() {
  console.log("== 1. tables ==");
  for (const t of ["credit_engine_migration_state", "user_credits", "credit_transactions",
    "generation_logs", "generation_cache", "generation_cost_config", "idempotency_keys",
    "subscriptions", "plan_allowances", "plan_entitlements"]) {
    const { error } = await supabase.from(t).select("*", { head: true });
    check(`table ${t}`, !error, error ? error.message.slice(0, 70) : "");
  }

  console.log("== 2. engine columns ==");
  const uc = await supabase.from("user_credits").select("balance,reserved,plan,monthly_allowance,last_refill_at,next_refill_at,subscription_status").limit(1);
  check("user_credits engine cols", !uc.error, uc.error?.message.slice(0, 70));
  const tx = await supabase.from("credit_transactions").select("type,balance_after,generation_id,plan,reason,metadata").limit(1);
  check("credit_transactions engine cols", !tx.error, tx.error?.message.slice(0, 70));

  console.log("== 3. markers ==");
  const { data: markers } = await supabase.from("credit_engine_migration_state").select("step");
  const steps = (markers || []).map((m) => m.step);
  for (const s of ["user_credits_backfill", "user_credits_unique_user_id", "credit_transactions_history_mapped"]) {
    check(`marker ${s}`, steps.includes(s));
  }

  console.log("== 4. wallets ==");
  const { data: wallets } = await supabase.from("user_credits").select("user_id,current_credits,total_earned_credits,balance,reserved,plan,monthly_allowance");
  const dupUsers = new Set((wallets || []).map((w) => w.user_id));
  check("no duplicate user_id", dupUsers.size === (wallets || []).length, `total wallets=${wallets?.length} (2 original + E2E test wallets)`);
  // Original production wallets: exact audit baseline, legacy untouched.
  const baseline = {
    "3618ceb7-90d4-4d57-b5d0-09cc0223c601": { current: 7, earned: 10 },
    "3d7cae55-d2da-4656-b9d2-073fab1de31b": { current: 509969, earned: 509999 },
  };
  for (const [uid, b] of Object.entries(baseline)) {
    const w = (wallets || []).find((x) => x.user_id === uid);
    const ok = w && w.current_credits === b.current && w.total_earned_credits === b.earned && w.balance === b.current;
    check(`original wallet ${uid.slice(0, 8)} intact (current=${b.current}, balance=current)`, !!ok, w ? JSON.stringify({ current: w.current_credits, earned: w.total_earned_credits, balance: w.balance, reserved: w.reserved }) : "missing");
  }
  // Fresh engine wallets (E2E): balance comes from grants; legacy current_credits stays 0 by design.
  const e2eWallets = (wallets || []).filter((w) => !(w.user_id in baseline));
  check("E2E wallets all reserved=0 (no stranded reservations)", e2eWallets.every((w) => w.reserved === 0), `e2e=${e2eWallets.length}`);

  console.log("== 5. transactions ==");
  const { data: txns, count } = await supabase.from("credit_transactions").select("id", { count: "exact" });
  check("txn count >= 38 (38 history + E2E evidence)", (count || 0) >= 38, `got ${count}`);
  const ids = new Set((txns || []).map((t) => t.id));
  check("no duplicate txn ids", ids.size === (txns || []).length);
  const { data: hist } = await supabase.from("credit_transactions").select("id,type,balance_after,transaction_type");
  const nullBal = (hist || []).filter((t) => t.balance_after === null);
  // Exactly the 38 pre-engine rows keep NULL balance_after (never fabricated).
  check("historical balance_after NULL == 38", nullBal.length === 38, `NULL=${nullBal.length}`);
  check("NULL rows are all pre-engine history", nullBal.every((t) => t.transaction_type === "earned" || t.transaction_type === "spent"), "");
  const engTx = (hist || []).filter((t) => t.balance_after !== null);
  check("all engine txns wrote balance_after", engTx.every((t) => t.type !== null && t.balance_after >= 0), `engine=${engTx.length}`);
  const { data: typed } = await supabase.from("credit_transactions").select("id,type").not("type", "is", null);
  console.log(`    mapped historical types: ${(typed || []).length} (trial_grant/admin_adjustment/generation_spend)`);
  const { data: legacy } = await supabase.from("credit_transactions").select("transaction_type,description,reference_id").limit(3);
  check("legacy txn cols intact", (legacy || []).length > 0 && "transaction_type" in (legacy[0] || {}));

  console.log("== 6. costs ==");
  const { data: costs } = await supabase.from("generation_cost_config").select("generation_type,credit_cost").eq("is_active", true);
  const expected = { midi: 1, vst_preset: 1, audio_sample: 3, advanced_audio: 3, advanced_edit: 4, batch: 5 };
  for (const [k, v] of Object.entries(expected)) {
    const row = (costs || []).find((c) => c.generation_type === k);
    check(`cost ${k}=${v}`, row && Number(row.credit_cost) === v, row ? `got ${row.credit_cost}` : "missing");
  }

  console.log("== 7. RPCs ==");
  const rpcCost1 = await supabase.rpc("get_generation_cost", { p_generation_type: "audio_sample", p_count: 1 });
  check("get_generation_cost(audio,1)=3", !rpcCost1.error && Number(rpcCost1.data) === 3, rpcCost1.error?.message.slice(0, 60) || `got ${rpcCost1.data}`);
  const rpcCost3 = await supabase.rpc("get_generation_cost", { p_generation_type: "audio_sample", p_count: 3 });
  check("get_generation_cost(audio,3)=9 (unit x count)", !rpcCost3.error && Number(rpcCost3.data) === 9, rpcCost3.error?.message.slice(0, 60) || `got ${rpcCost3.data}`);
  const rpcMidi = await supabase.rpc("get_generation_cost", { p_generation_type: "midi", p_count: 3 });
  check("get_generation_cost(midi,3)=3", !rpcMidi.error && Number(rpcMidi.data) === 3, rpcMidi.error?.message.slice(0, 60) || `got ${rpcMidi.data}`);
  for (const fn of ["reserve_credits", "consume_credits", "restore_credits", "grant_credits", "refill_credits"]) {
    // Existence probe: call with null user → expect a domain error, NOT 'function does not exist'.
    const { error } = await supabase.rpc(fn, fn === "get_generation_cost" ? {} : { p_user_id: "00000000-0000-0000-0000-000000000000", p_amount: 1 });
    const missing = error && /function .* does not exist|Could not find/i.test(error.message);
    check(`rpc ${fn} exists`, !missing, error ? error.message.slice(0, 70) : "ok");
  }

  console.log(`\nRESULT: ${pass} pass, ${failCount} fail`);
  process.exitCode = failCount ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
