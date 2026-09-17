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
  // Direct connection with service role key as password
  {
    host: `${ref}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: serviceRoleKey,
    ssl: { rejectUnauthorized: false },
    label: "direct-ref-key-ssl",
  },
  {
    host: `${ref}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: serviceRoleKey,
    ssl: false,
    label: "direct-ref-key-nossl",
  },
  // Pooler with service role key as password (pooler format)
  {
    host: "aws-0-us-east-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: `postgres.${ref}`,
    password: serviceRoleKey,
    ssl: { rejectUnauthorized: false },
    label: "pooler-east1-key-ssl",
  },
  {
    host: "aws-0-us-east-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: `postgres.${ref}`,
    password: serviceRoleKey,
    ssl: false,
    label: "pooler-east1-key-nossl",
  },
  // Pooler with service role key as anon key (sometimes works differently)
  {
    host: "aws-0-us-west-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: `postgres.${ref}`,
    password: serviceRoleKey,
    ssl: { rejectUnauthorized: false },
    label: "pooler-west1-key-ssl",
  },
];

async function tryConnect(cfg) {
  console.log(`\nTrying: ${cfg.label}`);
  console.log(`  host=${cfg.host} port=${cfg.port} user=${cfg.user} ssl=${!!cfg.ssl}`);
  try {
    const client = new pg.Client(cfg);
    await client.connect();
    console.log(`  SUCCESS! Connected via ${cfg.label}`);
    const res = await client.query("SELECT version() as v, current_user as u");
    console.log(`  PostgreSQL: ${res.rows[0].v.slice(0, 60)}`);
    console.log(`  Current user: ${res.rows[0].u}`);
    await client.end();
    return client;
  } catch (e) {
    console.log(`  FAILED: ${e.message.slice(0, 200)}`);
    return null;
  }
}

async function main() {
  for (const cfg of configs) {
    const client = await tryConnect(cfg);
    if (client) {
      console.log(`\n>>> Using connection: ${cfg.label}`);
      try {
        // Check existing tables
        const tablesResult = await client.query(`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          ORDER BY tablename;
        `);
        console.log("\nExisting public tables:", tablesResult.rows.map((r) => r.tablename));

        // Check user_credits columns
        const creditCols = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'user_credits'
          ORDER BY ordinal_position;
        `);
        if (creditCols.rowCount > 0) {
          console.log("\nuser_credits columns:");
          creditCols.rows.forEach((r) =>
            console.log(`  ${r.column_name} ${r.data_type} nullable=${r.is_nullable} default=${r.column_default}`)
          );
        } else {
          console.log("\nuser_credits does NOT exist");
        }

        // Check private schema
        const schemaResult = await client.query(`
          SELECT schema_name FROM information_schema.schemata
          WHERE schema_name = 'private';
        `);
        console.log(`\nPrivate schema exists: ${schemaResult.rowCount > 0}`);

        // Check existing data
        const dataResult = await client.query(`
          SELECT 
            (SELECT count(*) FROM user_credits) as uc,
            (SELECT count(*) FROM credit_transactions) as ct,
            (SELECT count(*) FROM profiles) as p;
        `);
        console.log("\nCounts:", dataResult.rows[0]);

        // Check user_credits data
        const ucResult = await client.query("SELECT * FROM user_credits LIMIT 3");
        console.log("\nuser_credits data:", JSON.stringify(ucResult.rows, null, 2));

        // Check credit_transactions data
        const ctResult = await client.query("SELECT * FROM credit_transactions LIMIT 3");
        console.log("\ncredit_transactions data:", JSON.stringify(ctResult.rows, null, 2));

        await client.end();
        break;
      } catch (e) {
        console.log(`Error during inspection: ${e.message.slice(0, 200)}`);
        await client.end();
      }
    }
  }
}

main().catch(console.error);
