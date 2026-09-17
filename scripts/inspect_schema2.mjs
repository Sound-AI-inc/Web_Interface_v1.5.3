import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read key from .dev.vars without printing it
const devVarsPath = path.join(process.cwd(), ".dev.vars");
const devVars = fs.readFileSync(devVarsPath, "utf-8");
const getVar = (name) => {
  const line = devVars.split("\n").find((l) => l.trim().startsWith(name + "="));
  return line ? line.split("=").slice(1).join("").trim() : "";
};

const supabaseUrl = getVar("SUPABASE_URL");
const serviceRoleKey = getVar("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { db: { schema: "public" }, persistSession: false, autoRefreshToken: false },
});

async function tryRpc(funcName, schema, params) {
  try {
    let call;
    if (schema) {
      call = supabase.schema(schema).rpc(funcName, params);
    } else {
      call = supabase.rpc(funcName, params);
    }
    const { data, error } = await call;
    if (error) {
      return { exists: false, error: error.message.slice(0, 150) };
    }
    return { exists: true, data };
  } catch (e) {
    return { exists: false, error: e.message.slice(0, 150) };
  }
}

async function main() {
  // Check get_generation_cost via private schema
  console.log("=== Calling private.get_generation_cost ===");
  const costResult = await tryRpc("get_generation_cost", "private", {
    p_generation_type: "audio_sample",
    p_count: 1,
  });
  console.log(`  Result: ${JSON.stringify(costResult)}`);

  // Check reserve_credits via private schema
  console.log("\n=== Calling private.reserve_credits ===");
  const reserveResult = await tryRpc("reserve_credits", "private", {
    p_user_id: "test-user-123",
    p_amount: 3,
    p_generation_id: null,
    p_reason: "Test reservation",
  });
  console.log(`  Result: ${JSON.stringify(reserveResult)}`);

  // Check consume_credits via private schema
  console.log("\n=== Calling private.consume_credits ===");
  const consumeResult = await tryRpc("consume_credits", "private", {
    p_user_id: "test-user-123",
    p_amount: 3,
    p_generation_id: null,
    p_reason: "Test consumption",
  });
  console.log(`  Result: ${JSON.stringify(consumeResult)}`);

  // Check restore_credits via private schema
  console.log("\n=== Calling private.restore_credits ===");
  const restoreResult = await tryRpc("restore_credits", "private", {
    p_user_id: "test-user-123",
    p_amount: 3,
    p_generation_id: null,
    p_reason: "Test restore",
  });
  console.log(`  Result: ${JSON.stringify(restoreResult)}`);

  // Check grant_credits via private schema
  console.log("\n=== Calling private.grant_credits ===");
  const grantResult = await tryRpc("grant_credits", "private", {
    p_user_id: "test-user-123",
    p_amount: 20,
    p_type: "trial_grant",
    p_reason: "Test grant",
    p_plan: "free_trial",
    p_monthly_allowance: 20,
  });
  console.log(`  Result: ${JSON.stringify(grantResult)}`);

  // Now check user_credits after grant
  console.log("\n=== Checking user_credits after grant ===");
  const { data: credits, error: creditsError } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", "test-user-123");
  if (creditsError) {
    console.log(`  Error: ${creditsError.message.slice(0, 150)}`);
  } else {
    console.log(`  Data: ${JSON.stringify(credits?.slice(0, 3))}`);
  }

  // Check credit_transactions for the test user
  console.log("\n=== Checking credit_transactions ===");
  const { data: txns, error: txnsError } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", "test-user-123");
  if (txnsError) {
    console.log(`  Error: ${txnsError.message.slice(0, 150)}`);
  } else {
    console.log(`  Transactions: ${txns?.length || 0}`);
    txns?.slice(0, 3).forEach((t) => console.log(`    ${t.type} ${t.amount} balance_after=${t.balance_after}`));
  }

  // Check generation_cost_config
  console.log("\n=== Checking generation_cost_config ===");
  const { data: costs, error: costsError } = await supabase
    .from("generation_cost_config")
    .select("*");
  if (costsError) {
    console.log(`  Error: ${costsError.message.slice(0, 150)}`);
  } else {
    console.log(`  Rows: ${costs?.length || 0}`);
    costs?.slice(0, 5).forEach((c) => console.log(`    ${c.generation_type} = ${c.credit_cost}`));
  }

  // Check generation_logs
  console.log("\n=== Checking generation_logs ===");
  const { data: logs, error: logsError } = await supabase
    .from("generation_logs")
    .select("*")
    .limit(5);
  if (logsError) {
    console.log(`  Error: ${logsError.message.slice(0, 150)}`);
  } else {
    console.log(`  Rows: ${logs?.length || 0}`);
    logs?.slice(0, 3).forEach((l) => console.log(`    ${l.status} ${l.tier} ${l.model_id}`));
  }

  // Check idempotency_keys
  console.log("\n=== Checking idempotency_keys ===");
  const { data: keys, error: keysError } = await supabase
    .from("idempotency_keys")
    .select("*")
    .limit(5);
  if (keysError) {
    console.log(`  Error: ${keysError.message.slice(0, 150)}`);
  } else {
    console.log(`  Rows: ${keys?.length || 0}`);
  }

  // Check plan_allowances
  console.log("\n=== Checking plan_allowances ===");
  const { data: allowances, error: allowancesError } = await supabase
    .from("plan_allowances")
    .select("*");
  if (allowancesError) {
    console.log(`  Error: ${allowancesError.message.slice(0, 150)}`);
  } else {
    console.log(`  Rows: ${allowances?.length || 0}`);
    allowances?.slice(0, 3).forEach((a) => console.log(`    ${a.plan_id}: ${a.monthly_allowance}`));
  }

  // Check plan_entitlements
  console.log("\n=== Checking plan_entitlements ===");
  const { data: ents, error: entsError } = await supabase
    .from("plan_entitlements")
    .select("*");
  if (entsError) {
    console.log(`  Error: ${entsError.message.slice(0, 150)}`);
  } else {
    console.log(`  Rows: ${ents?.length || 0}`);
  }

  // Check subscriptions
  console.log("\n=== Checking subscriptions ===");
  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select("*");
  if (subsError) {
    console.log(`  Error: ${subsError.message.slice(0, 150)}`);
  } else {
    console.log(`  Rows: ${subs?.length || 0}`);
  }
}

main().catch(console.error);
