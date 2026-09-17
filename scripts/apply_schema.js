import { Client } from "pg";
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
const projectRef = "xnjugeewwjclgsaynthi";

function tryConnectionString(host, port) {
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(serviceRoleKey)}@${host}:${port}/postgres`;
}

const configs = [
  { host: `db.${projectRef}.supabase.co`, port: 5432, label: "direct" },
  { host: "aws-0-us-west-1.pooler.supabase.com", port: 6543, label: "pooler-us-west-1" },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 6543, label: "pooler-us-east-1" },
];

async function tryConnect() {
  for (const cfg of configs) {
    const cs = tryConnectionString(cfg.host, cfg.port);
    console.log(`Trying connection: ${cfg.label} (${cfg.host}:${cfg.port})`);
    try {
      const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log(`  SUCCESS: Connected via ${cfg.label}`);
      return client;
    } catch (e) {
      console.log(`  FAILED: ${e.message.slice(0, 100)}`);
    }
  }
  return null;
}

async function checkExistingTables(client) {
  const result = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'generation_logs', 'user_credits', 'credit_transactions',
      'generation_cost_config', 'idempotency_keys', 'subscriptions',
      'plan_allowances', 'plan_entitlements', 'profiles',
      'generation_credit_balances'
    )
    ORDER BY tablename;
  `);
  console.log("\nExisting tables:", result.rows.map((r) => r.tablename));

  // Check user_credits columns
  const columnsResult = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_credits'
    ORDER BY ordinal_position;
  `);
  if (columnsResult.rowCount > 0) {
    console.log("\nuser_credits columns:");
    columnsResult.rows.forEach((r) => console.log(`  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`));
  } else {
    console.log("\nuser_credits table does NOT exist");
  }

  // Check existing data
  const countResult = await client.query(`
    SELECT 
      (SELECT count(*) FROM user_credits) as user_credits_count,
      (SELECT count(*) FROM credit_transactions) as credit_transactions_count,
      (SELECT count(*) FROM profiles) as profiles_count;
  `);
  console.log("\nRow counts:", countResult.rows[0]);

  // Check for private schema and functions
  const funcResult = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'private';
  `);
  console.log("\nPrivate schema functions:", funcResult.rows.map((r) => r.routine_name));
}

async function applyMigration(client, sql, label) {
  console.log(`\nApplying: ${label}`);
  try {
    await client.query(sql);
    console.log(`  SUCCESS: ${label}`);
  } catch (e) {
    const msg = e.message;
    if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("42P05")) {
      console.log(`  SKIP (already exists): ${label}`);
    } else {
      console.log(`  ERROR: ${msg.slice(0, 200)}`);
    }
  }
}

async function main() {
  const client = await tryConnect();
  if (!client) {
    console.log("\nCould not connect to database with any configuration.");
    console.log("The service role key connection may require the Supabase dashboard password instead.");
    process.exit(1);
  }

  try {
    await checkExistingTables(client);

    // Read schema files
    const schemaDir = path.join(process.cwd(), "supabase", "schema");
    const files = [
      "generation_logs.sql",
      "user_credits.sql",
      "generation_cost_config.sql",
      "idempotency_keys.sql",
      "subscriptions.sql",
      "plan_allowances.sql",
      "plan_entitlements.sql",
      "production_upgrade.sql",
    ];

    for (const file of files) {
      const filePath = path.join(schemaDir, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, "utf-8");
        await applyMigration(client, sql, file);
      } else {
        console.log(`\nSKIP (file not found): ${file}`);
      }
    }

    // Verify final state
    console.log("\n=== FINAL VERIFICATION ===");
    await checkExistingTables(client);

    // Check generation_cost_config
    const costResult = await client.query(`
      SELECT generation_type, credit_cost 
      FROM public.generation_cost_config 
      WHERE is_active = true
      ORDER BY generation_type;
    `);
    console.log("\nGeneration costs:");
    costResult.rows.forEach((r) => console.log(`  ${r.generation_type} = ${r.credit_cost} credits`));

  } finally {
    await client.end();
  }
}

main().catch(console.error);
