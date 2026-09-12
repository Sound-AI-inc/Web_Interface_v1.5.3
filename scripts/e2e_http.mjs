// Preview HTTP generation test with fresh funded user.
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
const WORKER = process.argv[2] || "https://web-interface-v1-5-3-preview.soundai-inc.workers.dev";
const COUNT = Number(process.argv[3] || 1);
const EXPECTED_COST = 3 * COUNT;
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const email = `e2e-http-${Date.now().toString(36)}@soundai-test.local`;
  const { data } = await admin.auth.admin.createUser({ email, password: `E2e-xQ9!${Date.now().toString(36)}`, email_confirm: true, user_metadata: { e2e: "http" } });
  const uid = data.user.id;
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const c = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess } = await c.auth.verifyOtp({ email, token: link.properties.email_otp, type: "magiclink" });
  const jwt = sess.session.access_token;
  const ref = `e2e-http-${Date.now()}`;
  const g = await admin.rpc("grant_credits", { p_user_id: uid, p_amount: 20, p_type: "trial_grant", p_reason: `e2e:${ref}`, p_plan: "trial", p_monthly_allowance: 20, p_grant_reference: ref });
  console.log(`funded: balance=${g.data} err=${g.error?.message || "none"}`);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 170000);
  let status = 0, body = null;
  try {
    const r = await fetch(`${WORKER}/api/generate`, {
      method: "POST", signal: ctrl.signal,
      headers: { "content-type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ request: { prompt: "e2e calm ambient pad", component: "SoundCraft", mode: "lite", output_type: "audio" }, count: COUNT, idempotency_key: randomUUID() }),
    });
    status = r.status;
    body = await r.json();
  } catch (e) { body = { error: `FETCH_${e.name}: ${e.message}` }; } finally { clearTimeout(timer); }
  console.log(`HTTP ${status}: ${JSON.stringify(body).slice(0, 500)}`);
  const w = (await admin.from("user_credits").select("balance,reserved").eq("user_id", uid).maybeSingle()).data;
  const tx = await admin.from("credit_transactions").select("type,amount,balance_after").eq("user_id", uid).order("created_at");
  console.log(`wallet: ${JSON.stringify(w)}`);
  console.log(`txns: ${JSON.stringify(tx.data)}`);
  const res = (tx.data || []).find((t) => t.type === "generation_reserve");
  if (res && res.amount === EXPECTED_COST) {
    console.log(`HTTP-COUNT: PASS (server reserved unit x count = ${EXPECTED_COST})`);
  } else {
    console.log(`HTTP-COUNT: requested=${COUNT} reserved=${res ? res.amount : "none"} (inference fails after reserve; mult proven iff reserved=${EXPECTED_COST})`);
    process.exitCode = res && res.amount === EXPECTED_COST ? 0 : 1;
  }
}

main().catch((e) => { console.error("FAILED:", e.message); process.exitCode = 1; });
