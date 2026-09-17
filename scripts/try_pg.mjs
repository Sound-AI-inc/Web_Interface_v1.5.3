import pg from "pg";
import * as fs from "fs";
import * as path from "path";

const devVarsPath = path.join(process.cwd(), ".dev.vars");
const devVars = fs.readFileSync(devVarsPath, "utf-8");
const getVar = (name) => {
  const line = devVars.split("\n").find((l) => l.trim().startsWith(name + "="));
  return line ? line.split("=").slice(1).join("").trim() : "";
};

const serviceRoleKey = getVar("SUPABASE_SERVICE_ROLE_KEY");
const ref = "xnjugeewwjclgsaynthi";

const configs = [
  { host: `${ref}.supabase.co`, port: 5432, user: "postgres", password: serviceRoleKey, ssl: { rejectUnauthorized: false }, label: "direct-ssl" },
  { host: `${ref}.supabase.co`, port: 5432, user: "postgres", password: serviceRoleKey, ssl: false, label: "direct-nossl" },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 6543, user: `postgres.${ref}`, password: serviceRoleKey, ssl: { rejectUnauthorized: false }, label: "pooler-east1-ssl" },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 6543, user: `postgres.${ref}`, password: serviceRoleKey, ssl: false, label: "pooler-east1-nossl" },
  { host: "aws-0-us-west-1.pooler.supabase.com", port: 6543, user: `postgres.${ref}`, password: serviceRoleKey, ssl: { rejectUnauthorized: false }, label: "pooler-west1-ssl" },
  { host: "aws-0-us-west-1.pooler.supabase.com", port: 6543, user: `postgres.${ref}`, password: serviceRoleKey, ssl: false, label: "pooler-west1-nossl" },
];

async function tryConnect(cfg) {
  try {
    const client = new pg.Client(cfg);
    await client.connect();
    const res = await client.query("SELECT version() as v, current_user as u");
    console.log(`SUCCESS: ${cfg.label} -> ${res.rows[0].u}`);
    await client.end();
    return client;
  } catch (e) {
    console.log(`FAIL: ${cfg.label} - ${e.message.slice(0, 100)}`);
    return null;
  }
}

async function main() {
  for (const cfg of configs) {
    const client = await tryConnect(cfg);
    if (client) {
      try {
        const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
        console.log("\nTables:", tables.rows.map(r => r.tablename).join(", "));
        const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='user_credits' ORDER BY ordinal_position`);
        console.log("user_credits cols:", cols.rows.map(r => r.column_name).join(", "));
        const data = await client.query("SELECT * FROM user_credits LIMIT 2");
        console.log("user_credits data:", JSON.stringify(data.rows));
      } catch (e) {
        console.log(`Query error: ${e.message.slice(0, 100)}`);
      }
      await client.end();
      break;
    }
  }
}

main().catch(console.error);