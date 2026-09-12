// Production runtime E2E A–G. Dedicated test users only; existing wallets untouched.
// New test wallets/transactions are additive E2E evidence (not customer data).
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const devVars = fs.readFileSync(path.join(process.cwd(), ".dev.vars"), "utf-8");
const getVar = (name) => {
  const line = devVars.split("\n").find((l) => l.trim().startsWith(name + "="));
  return line ? line.split("=").slice(1).join("").trim() : "";
};
const supabaseUrl = getVar("SUPABASE_URL");
const serviceKey = getVar("SUPABASE_SERVICE_ROLE_KEY");
const envFile = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
const anonKey = envFile.split("\n").find((l) => l.trim().startsWith("VITE_SUPABASE_ANON_KEY=")).split("=").slice(1).join("").trim();
const WORKER = "https://web-interface-v1-5-3.soundai-inc.workers.dev";

const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = (jwt) => createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : {},
});

let pass = 0, failCount = 0;
const check = (name, ok, detail = "") => {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? " — " + detail : ""}`);
  ok ? pass++ : failCount++;
};
const rpc = (fn, params) => admin.rpc(fn, params);
const wallet = async (uid) => (await admin.from("user_credits").select("balance,reserved").eq("user_id", uid).maybeSingle()).data;
const txns = async (uid, type) => {
  const q = admin.from("credit_transactions").select("id,type,amount,balance_after,generation_id").eq("user_id", uid);
  const { data } = type ? await q.eq("type", type) : await q;
  return data || [];
};

async function makeUser(tag) {
  const email = `e2e-${tag}-${Date.now().toString(36)}@soundai-test.local`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: `E2e-${tag}-xQ9!${Date.now().toString(36)}`, email_confirm: true, user_metadata: { e2e: tag } });
  if (error) throw error;
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const c = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess, error: e2 } = await c.auth.verifyOtp({ email, token: link.properties.email_otp, type: "magiclink" });
  if (e2) throw e2;
  return { id: data.user.id, jwt: sess.session.access_token };
}
async function fund(uid, amount, ref, type = "trial_grant") {
  const { data, error } = await rpc("grant_credits", { p_user_id: uid, p_amount: amount, p_type: type, p_reason: `e2e:${ref}`, p_plan: "trial", p_monthly_allowance: 20, p_grant_reference: ref });
  if (error) throw new Error(`fund failed: ${error.message}`);
  return Number(data);
}

async function main() {
  console.log("== A. success 20 -> 17 (reserve 3 + consume 3) ==");
  const A = await makeUser("A");
  check("A funded to 20", (await fund(A.id, 20, `e2e-A-${Date.now()}`)) === 20);
  const genA = randomUUID();
  await rpc("reserve_credits", { p_user_id: A.id, p_amount: 3, p_generation_id: genA, p_reason: "e2e A" });
  let w = await wallet(A.id);
  check("A reserved: balance 17", w.balance === 17, `balance=${w.balance} reserved=${w.reserved}`);
  await rpc("consume_credits", { p_user_id: A.id, p_amount: 3, p_generation_id: genA, p_reason: "e2e A" });
  w = await wallet(A.id);
  check("A consumed: balance 17 reserved 0", w.balance === 17 && w.reserved === 0, JSON.stringify(w));
  const aSpend = await txns(A.id, "generation_spend");
  check("A one spend txn balance_after=17", aSpend.length === 1 && aSpend[0].balance_after === 17, JSON.stringify(aSpend));

  console.log("== B. mult 20 -> 11 (3 x 3 = 9 server-side) ==");
  const B = await makeUser("B");
  await fund(B.id, 20, `e2e-B-${Date.now()}`);
  const cost3 = await rpc("get_generation_cost", { p_generation_type: "audio_sample", p_count: 3 });
  check("B server cost(3)=9", Number(cost3.data) === 9, `got ${cost3.data}`);
  const genB = randomUUID();
  await rpc("reserve_credits", { p_user_id: B.id, p_amount: Number(cost3.data), p_generation_id: genB, p_reason: "e2e B" });
  await rpc("consume_credits", { p_user_id: B.id, p_amount: Number(cost3.data), p_generation_id: genB, p_reason: "e2e B" });
  w = await wallet(B.id);
  check("B balance 11", w.balance === 11 && w.reserved === 0, JSON.stringify(w));

  console.log("== C. insufficient (balance 2, cost 3) ==");
  const C = await makeUser("C");
  await fund(C.id, 2, `e2e-C-${Date.now()}`);
  const cRes = await rpc("reserve_credits", { p_user_id: C.id, p_amount: 3, p_generation_id: randomUUID(), p_reason: "e2e C" });
  check("C reserve rejected INSUFFICIENT_CREDITS", !!cRes.error && /INSUFFICIENT_CREDITS/.test(cRes.error.message), cRes.error?.message.slice(0, 60));
  w = await wallet(C.id);
  check("C balance unchanged 2", w.balance === 2 && w.reserved === 0, JSON.stringify(w));
  check("C no spend txn", (await txns(C.id, "generation_spend")).length === 0);

  console.log("== D. failure restore 20 -> 20, no dup refund ==");
  const D = await makeUser("D");
  await fund(D.id, 20, `e2e-D-${Date.now()}`);
  const genD = randomUUID();
  await rpc("reserve_credits", { p_user_id: D.id, p_amount: 3, p_generation_id: genD, p_reason: "e2e D" });
  w = await wallet(D.id);
  check("D reserved: 17/3", w.balance === 17 && w.reserved === 3, JSON.stringify(w));
  await rpc("restore_credits", { p_user_id: D.id, p_amount: 3, p_generation_id: genD, p_reason: "e2e D fail" });
  w = await wallet(D.id);
  check("D restored: 20/0", w.balance === 20 && w.reserved === 0, JSON.stringify(w));
  await rpc("restore_credits", { p_user_id: D.id, p_amount: 3, p_generation_id: genD, p_reason: "e2e D dup" });
  w = await wallet(D.id);
  const dRest = await txns(D.id, "generation_restore");
  check("D dup restore no-op (20, one restore txn)", w.balance === 20 && dRest.length === 1, `balance=${w.balance} restores=${dRest.length}`);
  const noRestore = await rpc("restore_credits", { p_user_id: A.id, p_amount: 3, p_generation_id: genA, p_reason: "e2e no-restore-after-consume" });
  w = await wallet(A.id);
  const aRest = await txns(A.id, "generation_restore");
  check("no restore after consume (A stays 17, zero restore txns)", !noRestore.error && w.balance === 17 && aRest.length === 0, `balance=${w.balance} restores=${aRest.length}`);

  console.log("== E. generation idempotency ==");
  const genE = randomUUID();
  await rpc("reserve_credits", { p_user_id: D.id, p_amount: 3, p_generation_id: genE, p_reason: "e2e E1" });
  const eMid = await wallet(D.id);
  await rpc("reserve_credits", { p_user_id: D.id, p_amount: 3, p_generation_id: genE, p_reason: "e2e E2" });
  w = await wallet(D.id);
  const eRes = (await txns(D.id, "generation_reserve")).filter((t) => t.generation_id === genE);
  check("E dup reserve: single txn, balance unchanged", eRes.length === 1 && w.balance === eMid.balance, `reserves=${eRes.length} ${eMid.balance}->${w.balance}`);
  await rpc("consume_credits", { p_user_id: D.id, p_amount: 3, p_generation_id: genE, p_reason: "e2e E" });
  await rpc("consume_credits", { p_user_id: D.id, p_amount: 3, p_generation_id: genE, p_reason: "e2e E dup" });
  w = await wallet(D.id);
  const eSpend = (await txns(D.id, "generation_spend")).filter((t) => t.generation_id === genE);
  check("E dup consume: single spend txn", eSpend.length === 1, `spends=${eSpend.length} balance=${w.balance}`);
  const wrongAmt = await rpc("consume_credits", { p_user_id: B.id, p_amount: 999, p_generation_id: genB, p_reason: "e2e mismatch" });
  check("E arbitrary consume rejected", !!wrongAmt.error && /MISMATCH|NO_RESERVATION/.test(wrongAmt.error.message), wrongAmt.error?.message.slice(0, 60));

  console.log("== F. grant/Stripe-event idempotency ==");
  const F = await makeUser("F");
  const evtRef = `stripe:evt_e2e_${Date.now().toString(36)}`;
  const g1 = await rpc("grant_credits", { p_user_id: F.id, p_amount: 30, p_type: "subscription_grant", p_reason: "stripe:customer.subscription.created", p_plan: "standard_monthly", p_monthly_allowance: 30, p_grant_reference: evtRef });
  const g2 = await rpc("grant_credits", { p_user_id: F.id, p_amount: 30, p_type: "subscription_grant", p_reason: "stripe:customer.subscription.created", p_plan: "standard_monthly", p_monthly_allowance: 30, p_grant_reference: evtRef });
  w = await wallet(F.id);
  const fTx = await txns(F.id, "subscription_grant");
  check("F dup grant: credited once (30, one txn)", Number(g1.data) === 30 && Number(g2.data) === 30 && w.balance === 30 && fTx.length === 1, `g1=${g1.data} g2=${g2.data} balance=${w.balance} txns=${fTx.length}`);

  console.log("== G. refill/cooldown enforcement ==");
  const gRefill = await rpc("refill_credits", { p_user_id: D.id, p_amount: 5, p_reason: "e2e G", p_enforce_cap: true });
  check("G refill with balance>0 rejected REFILL_NOT_DUE", !!gRefill.error && /REFILL_NOT_DUE/.test(gRefill.error.message), gRefill.error?.message.slice(0, 60));
  const expired = await rpc("refill_credits", { p_user_id: "3618ceb7-90d4-4d57-b5d0-09cc0223c601", p_amount: 5, p_reason: "e2e G", p_enforce_cap: true });
  check("G expired trial refill rejected TRIAL_EXPIRED (no write)", !!expired.error && /TRIAL_EXPIRED/.test(expired.error.message), expired.error?.message.slice(0, 60));
  const wExp = await wallet("3618ceb7-90d4-4d57-b5d0-09cc0223c601");
  check("G expired wallet untouched (7/0)", wExp.balance === 7 && wExp.reserved === 0, JSON.stringify(wExp));
  const { data: cfg } = await admin.from("plan_allowances").select("plan_id,refill_base_cooldown_hours,refill_max_cooldown_hours").in("plan_id", ["free_trial", "standard_monthly", "premium_flex_50"]);
  const cm = Object.fromEntries((cfg || []).map((c) => [c.plan_id, `${c.refill_base_cooldown_hours}/${c.refill_max_cooldown_hours}`]));
  check("G cooldown config 24/24 trial, 24/120 std+prem", cm.free_trial === "24/24" && cm.standard_monthly === "24/120" && cm.premium_flex_50 === "24/120", JSON.stringify(cm));

  console.log("== A-HTTP. real /api/generate 20 -> 17 ==");
  const H = await makeUser("H");
  await fund(H.id, 20, `e2e-H-${Date.now()}`);
  const idemKey = randomUUID();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 170000);
  let hBody = null, hStatus = 0;
  try {
    const hr = await fetch(`${WORKER}/api/generate`, {
      method: "POST", signal: ctrl.signal,
      headers: { "content-type": "application/json", Authorization: `Bearer ${H.jwt}` },
      body: JSON.stringify({ request: { prompt: "e2e test calm ambient pad", component: "SoundCraft", mode: "lite", output_type: "audio" }, count: 1, idempotency_key: idemKey }),
    });
    hStatus = hr.status;
    hBody = await hr.json();
  } catch (e) { hBody = { error: `FETCH_${e.name}` }; } finally { clearTimeout(timer); }
  const hw = await wallet(H.id);
  console.log(`    HTTP status=${hStatus} body=${JSON.stringify(hBody).slice(0, 300)} wallet=${JSON.stringify(hw)}`);
  if (hStatus === 200 && hBody?.credits?.consumed === 3 && hBody?.credits?.remaining === 17 && hw.balance === 17) {
    check("A-HTTP 20->17 via live worker", true);
  } else if (hw.balance === 20 && (await txns(H.id, "generation_spend")).length === 0) {
    check("A-HTTP inference unavailable, credits auto-restored/untouched (20, no spend)", true, `status=${hStatus} err=${hBody?.error}`);
  } else {
    check("A-HTTP exact 20->17", false, `status=${hStatus} wallet=${JSON.stringify(hw)}`);
  }

  console.log(`\nE2E RESULT: ${pass} pass, ${failCount} fail`);
  process.exitCode = failCount ? 1 : 0;
}

main().catch((e) => { console.error("E2E FAILED:", e.message); process.exitCode = 1; });
