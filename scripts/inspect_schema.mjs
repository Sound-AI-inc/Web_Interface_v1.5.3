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
  auth: { persistSession: false, autoRefreshToken: false },
});

async function checkTable(name) {
  try {
    const { count, error } = await supabase.from(name).select("*", { count: "exact", head: true });
    if (error) {
      if (error.message.includes("does not exist") || error.code === "PGRST104") {
        return { name, exists: false };
      }
      console.log(`  ${name}: error ${error.code || ""} ${error.message.slice(0, 80)}`);
      return { name, exists: false, error: error.message.slice(0, 80) };
    }
    return { name, exists: true, count };
  } catch (e) {
    return { name, exists: "unknown", error: e.message.slice(0, 80) };
  }
}

async function checkRpcFunction(funcName) {
  try {
    const { data, error } = await supabase.rpc(funcName, {
      p_generation_type: "audio_sample",
      p_count: 1,
    });
    if (error) {
      if (error.message.includes("does not exist") || error.message.includes("Could not resolve")) {
        return { name: funcName, exists: false };
      }
      // Function exists but might error on parameters - check if it's not a "does not exist" error
      const msg = error.message.toUpperCase();
      if (msg.includes("FUNCTION") && msg.includes("DOES NOT EXIST")) {
        return { name: funcName, exists: false };
      }
      return { name: funcName, exists: true, note: error.message.slice(0, 80) };
    }
    return { name: funcName, exists: true, returns: data };
  } catch (e) {
    return { name: funcName, exists: "unknown", error: e.message.slice(0, 80) };
  }
}

async function main() {
  console.log("=== Checking Supabase tables ===");
  const tables = [
    "user_credits", "credit_transactions", "profiles",
    "generation_logs", "generation_cost_config", "idempotency_keys",
    "subscriptions", "plan_allowances", "plan_entitlements",
    "generation_cache",
  ];
  for (const t of tables) {
    const info = await checkTable(t);
    console.log(`  ${t}: ${info.exists ? "EXISTS" : "MISSING"} ${info.count !== undefined ? `(${info.count} rows)` : ""}`);
  }

  console.log("\n=== Checking RPC functions (private schema) ===");
  // The get_generation_cost function is in the private schema
  // With the service_role key, we should be able to call it
  const functions = [
    "get_generation_cost", "reserve_credits", "consume_credits",
    "restore_credits", "grant_credits", "refill_credits",
  ];
  for (const f of functions) {
    const info = await checkRpcFunction(f);
    console.log(`  ${f}: ${info.exists ? "EXISTS" : "MISSING"}`);
  }

  // Check if we can access the private schema
  console.log("\n=== Checking private schema ===");
  try {
    const { data, error } = await supabase.rpc("get_generation_cost", {
      p_generation_type: "audio_sample",
      p_count: 1,
    });
    if (error) {
      console.log(`  get_generation_cost error: ${error.message.slice(0, 100)}`);
      if (error.message.includes("does not exist") || error.message.includes("Could not resolve")) {
        console.log("  -> private.get_generation_cost does NOT exist");
      }
    } else {
      console.log(`  get_generation_cost returned: ${data}`);
    }
  } catch (e) {
    console.log(`  Exception: ${e.message.slice(0, 100)}`);
  }

  // Check user_credits schema
  console.log("\n=== Checking user_credits schema ===");
  try {
    // Try to select with the new schema columns
    const { data, error } = await supabase
      .from("user_credits")
      .select("balance, reserved, plan, monthly_allowance, last_refill_at, next_refill_at, subscription_status")
      .limit(1);
    if (error) {
      console.log(`  Error with new columns: ${error.message.slice(0, 100)}`);
      // Try legacy column
      const { data: legacyData, error: legacyError } = await supabase
        .from("user_credits")
        .select("remaining")
        .limit(1);
      if (legacyError) {
        console.log(`  Error with remaining column: ${legacyError.message.slice(0, 100)}`);
      } else {
        console.log(`  Legacy 'remaining' column EXISTS. Data: ${JSON.stringify(legacyData?.slice(0, 3))}`);
      }
    } else {
      console.log(`  New schema columns work. Data sample: ${JSON.stringify(data?.slice(0, 3))}`);
    }
  } catch (e) {
    console.log(`  Exception: ${e.message.slice(0, 100)}`);
  }

  // Check generation_cost_config data
  console.log("\n=== Checking generation_cost_config ===");
  try {
    const { data, error } = await supabase
      .from("generation_cost_config")
      .select("generation_type, credit_cost, is_active")
      .eq("is_active", true);
    if (error) {
      console.log(`  Error: ${error.message.slice(0, 100)}`);
    } else if (data && data.length > 0) {
      data.forEach((r) => console.log(`  ${r.generation_type} = ${r.credit_cost} credits`));
    } else {
      console.log("  No active cost config rows");
    }
  } catch (e) {
    console.log(`  Exception: ${e.message.slice(0, 100)}`);
  }
}

main().catch(console.error);
