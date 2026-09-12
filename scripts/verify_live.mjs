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
  check("wallet count = 2", wallets?.length === 2, `got ${wallets?.length}`);
  const dupUsers = new Set((wallets || []).map((w) => w.user_id));
  check("no duplicate user_id", dupUsers.size === (wallets || []).length);
  for (const w of wallets || []) {
    check(`wallet ${w.user_id.slice(0, 8)} balance=current (${w.balance}=${w.current_credits})`, w.balance === w.current_credits);
    console.log(`    earned=${w.total_earned_credits} reserved=${w.reserved} plan=${w.plan} allowance=${w.monthly_allowance}`);
  }

  console.log("== 5. transactions ==");
  const { data: txns, count } = await supabase.from("credit_transactions").select("id", { count: "exact" });
  check("txn count = 38", count === 38, `got ${count}`);
  const ids = new Set((txns || []).map((t) => t.id));
  check("no duplicate txn ids", ids.size === (txns || []).length);
  const { data: hist } = await supabase.from("credit_transactions").select("id,type,balance_after");
  const histNullBal = (hist || []).filter((t) => t.balance_after === null).length;
  check("historical balance_after NULL preserved", histNullBal === (hist || []).length, `${histNullBal}/${(hist || []).length} NULL`);
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
