// HTTP idempotency proof: same idempotency_key twice against failing inference.
// Expect: req1 500 + reserve/restore pair; req2 409 replay; NO second charge.
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
const WORKER = process.argv[2];
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const email = `e2e-idem-${Date.now().toString(36)}@soundai-test.local`;
  const { data } = await admin.auth.admin.createUser({ email, password: `E2e-xQ9!${Date.now().toString(36)}`, email_confirm: true, user_metadata: { e2e: "idem-http" } });
  const uid = data.user.id;
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const c = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess } = await c.auth.verifyOtp({ email, token: link.properties.email_otp, type: "magiclink" });
  const jwt = sess.session.access_token;
  const ref = `e2e-idem-${Date.now()}`;
  await admin.rpc("grant_credits", { p_user_id: uid, p_amount: 20, p_type: "trial_grant", p_reason: `e2e:${ref}`, p_plan: "trial", p_monthly_allowance: 20, p_grant_reference: ref });

  const key = randomUUID();
  const payload = { request: { prompt: "http idempotency probe", component: "SoundCraft", mode: "lite", output_type: "audio" }, count: 1, idempotency_key: key };
  const post = async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 170000);
    try {
      const r = await fetch(`${WORKER}/api/generate`, { method: "POST", signal: ctrl.signal, headers: { "content-type": "application/json", Authorization: `Bearer ${jwt}` }, body: JSON.stringify(payload) });
      return { status: r.status, body: await r.text() };
    } finally { clearTimeout(t); }
  };
  const r1 = await post();
  console.log(`req1: ${r1.status} ${r1.body.slice(0, 80)}`);
  const r2 = await post();
  console.log(`req2: ${r2.status} ${r2.body.slice(0, 120)}`);
  const w = (await admin.from("user_credits").select("balance,reserved").eq("user_id", uid).maybeSingle()).data;
  const tx = (await admin.from("credit_transactions").select("type,amount,balance_after").eq("user_id", uid).order("created_at")).data;
  console.log(`wallet: ${JSON.stringify(w)} txns: ${JSON.stringify(tx)}`);
  const reserves = tx.filter((t) => t.type === "generation_reserve").length;
  const spends = tx.filter((t) => t.type === "generation_spend").length;
  const ok = r1.status === 500 && r2.status === 409 && w.balance === 20 && w.reserved === 0 && reserves === 1 && spends === 0;
  console.log(ok ? "HTTP-IDEMPOTENCY: PASS (one reserve/restore, replay 409, no charge)" : "HTTP-IDEMPOTENCY: FAIL");
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => { console.error("FAILED:", e.message); process.exitCode = 1; });
