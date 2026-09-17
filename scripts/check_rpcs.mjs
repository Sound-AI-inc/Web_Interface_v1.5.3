import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

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

// Try to execute SQL via the REST API directly
async function execSql(sql, label) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ sql }),
    });
    if (response.ok) {
      const data = await response.json();
      console.log(`  ${label}: OK`);
      return true;
    }
    const text = await response.text();
    if (text.includes("does not exist") || text.includes("PGRST202")) {
      console.log(`  ${label}: exec_sql not available`);
      return false;
    }
    console.log(`  ${label}: ${text.slice(0, 100)}`);
    return false;
  } catch (e) {
    console.log(`  ${label}: ${e.message.slice(0, 100)}`);
    return false;
  }
}

async function main() {
  // Check if exec_sql exists
  const { data: funcs, error: funcsError } = await supabase
    .from("pg_proc")
    .select("proname")
    .eq("pronamespace", "public");
  if (funcsError) {
    console.log(`pg_proc query: ${funcsError.message.slice(0, 100)}`);
  } else {
    console.log("Public functions:", funcs.map(f => f.proname).join(", "));
  }

  // Check if there's a way to run SQL
  console.log("\n=== Checking available RPC functions ===");
  const { data: allFuncs, error: allFuncsError } = await supabase
    .from("information_schema.routines")
    .select("routine_name, routine_schema")
    .limit(20);
  if (allFuncsError) {
    console.log(`  Error: ${allFuncsError.message.slice(0, 100)}`);
  } else {
    allFuncs.forEach(f => console.log(`  ${f.routine_schema}.${f.routine_name}`));
  }

  // Try direct SQL via REST API
  console.log("\n=== Trying direct REST API SQL ===");
  const sql = "SELECT 1 as test";
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  console.log(`  exec_sql status: ${response.status}`);
  if (response.ok) {
    const data = await response.json();
    console.log(`  Result: ${JSON.stringify(data)}`);
  } else {
    const text = await response.text();
    console.log(`  Response: ${text.slice(0, 200)}`);
  }

  // Try direct query to the database via REST
  console.log("\n=== Trying direct table query ===");
  const { data, error } = await supabase.from("user_credits").select("*").limit(1);
  if (error) {
    console.log(`  Error: ${error.message.slice(0, 150)}`);
  } else {
    console.log(`  Data: ${JSON.stringify(data)}`);
  }

  // Try to get the database schema via REST
  console.log("\n=== Trying pg_tables via REST ===");
  const { data: tables, error: tablesError } = await supabase.from("pg_tables").select("tablename").eq("schemaname", "public");
  if (tablesError) {
    console.log(`  Error: ${tablesError.message.slice(0, 150)}`);
  } else {
    console.log(`  Tables: ${tables.map(t => t.tablename).join(", ")}`);
  }
}

main().catch(console.error);