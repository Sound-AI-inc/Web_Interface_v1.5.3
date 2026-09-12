// E2E part 1 (runnable NOW): dedicated test user + authenticated /api/credits.
// Creates ONE new auth user (additive; existing wallets untouched).
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const devVars = fs.readFileSync(path.join(process.cwd(), ".dev.vars"), "utf-8");
const getVar = (name) => {
  const line = devVars.split("\n").find((l) => l.trim().startsWith(name + "="));
  return line ? line.split("=").slice(1).join("").trim() : "";
};

const supabaseUrl = getVar("SUPABASE_URL");
const serviceKey = getVar("SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const WORKER = "https://web-interface-v1-5-3.soundai-inc.workers.dev";
const stamp = Date.now().toString(36);
const EMAIL = `e2e-credits-${stamp}@soundai-test.local`;
const PASSWORD = `E2e-${stamp}-xQ9!`;

async function main() {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
    user_metadata: { e2e: "credit-engine", created: new Date().toISOString() },
  });
  if (createErr) throw createErr;
  const userId = created.user.id;
  console.log(`test user: ${EMAIL} id=${userId}`);

  const envFile = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
  const anonKey = envFile.split("\n").find((l) => l.trim().startsWith("VITE_SUPABASE_ANON_KEY=")).split("=").slice(1).join("").trim();
  const authed = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
  if (linkErr) throw linkErr;
  const { data: session, error: signErr } = await authed.auth.verifyOtp({ email: EMAIL, token: link.properties.email_otp, type: "magiclink" });
  if (signErr) throw signErr;
  const jwt = session.session.access_token;
  console.log("signin OK, jwt acquired");

  const res = await fetch(`${WORKER}/api/credits`, { headers: { Authorization: `Bearer ${jwt}` } });
  const body = await res.json();
  console.log(`GET /api/credits -> ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);

  fs.writeFileSync(path.join(process.cwd(), "tmp", `e2e-test-user-${stamp}.json`),
    JSON.stringify({ email: EMAIL, password: "__redacted__", userId, jwt: "__redacted__" }));
  // Print JWT to stdout is sensitive; instead store contact sheet without secret:
  fs.writeFileSync("C:/Users/elato/AppData/Local/Temp/opencode/e2e_jwt.txt", jwt);
  console.log("jwt stored in temp contact file (not repo)");
}

main().catch((e) => { console.error("E2E-1 FAILED:", e.message); process.exitCode = 1; });
