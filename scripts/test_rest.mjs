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

async function execSql(sql, label) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    });
    if (response.ok) {
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
  // Try exec_sql
  const ok = await execSql("SELECT 1 as test", "test");
  if (!ok) {
    console.log("exec_sql not available, trying alternative approaches...");
    
    // Try the /rest/v1/ endpoint directly
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "GET",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
      });
      console.log(`  Root endpoint status: ${response.status}`);
      const text = await response.text();
      console.log(`  Root response: ${text.slice(0, 200)}`);
    } catch (e) {
      console.log(`  Root endpoint error: ${e.message.slice(0, 100)}`);
    }
    
    // Try the /rest/v1/ endpoint with a query
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/user_credits?select=*&limit=1`, {
        method: "GET",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
      });
      console.log(`  user_credits query status: ${response.status}`);
      const text = await response.text();
      console.log(`  user_credits response: ${text.slice(0, 200)}`);
    } catch (e) {
      console.log(`  user_credits query error: ${e.message.slice(0, 100)}`);
    }
    
    // Try the /rest/v1/ endpoint with a POST to create a table
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "POST",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: "SELECT 1 as test" }),
      });
      console.log(`  POST root status: ${response.status}`);
      const text = await response.text();
      console.log(`  POST root response: ${text.slice(0, 200)}`);
    } catch (e) {
      console.log(`  POST root error: ${e.message.slice(0, 100)}`);
    }
  }
}

main().catch(console.error);