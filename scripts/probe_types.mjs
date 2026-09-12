// READ-ONLY type probe: uuid columns reject non-uuid literals (400),
// text columns accept anything (200 + 0 rows). No DDL, no writes.
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

async function probe(table, column) {
  const { error } = await supabase.from(table).select("id").eq(column, "not-a-uuid-probe").limit(1);
  if (!error) {
    console.log(`  ${table}.${column}: TEXT (accepted non-uuid literal)`);
    return "text";
  }
  if (/invalid input syntax for (type )?uuid/i.test(error.message)) {
    console.log(`  ${table}.${column}: UUID (rejected: ${error.message.slice(0, 60)})`);
    return "uuid";
  }
  console.log(`  ${table}.${column}: UNKNOWN (${error.message.slice(0, 80)})`);
  return "unknown";
}

async function main() {
  await probe("user_credits", "user_id");
  await probe("user_credits", "id");
  await probe("credit_transactions", "user_id");
  await probe("credit_transactions", "id");
  await probe("credit_transactions", "reference_id");
}

main().catch(console.error);
