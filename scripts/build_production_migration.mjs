// Builds supabase/schema/credit_engine_production_migration.sql by
// concatenating the repo migration files in the mandated production order.
// Run: node scripts/build_production_migration.mjs
import * as fs from "fs";
import * as path from "path";

const schemaDir = path.join(process.cwd(), "supabase", "schema");
const outFile = path.join(schemaDir, "credit_engine_production_migration.sql");

// Logical production order (section 12). user_credits.sql carries steps
// 2+5+14+15 (additive columns, RPCs, RLS); credit_engine_backfill.sql
// carries steps 3+4+6 plus pre-commit verification.
const orderedFiles = [
  "credit_engine_migration_state.sql",
  "user_credits.sql",
  "credit_engine_backfill.sql",
  "generation_logs.sql",
  "idempotency_keys.sql",
  "subscriptions.sql",
  "plan_allowances.sql",
  "plan_entitlements.sql",
  "generation_cost_config.sql",
];

let out = `-- SoundAI Credit Engine — PRODUCTION MIGRATION (single paste).
-- GENERATED from repo files by scripts/build_production_migration.mjs.
-- Do NOT hand-edit: change the source files and rebuild.
-- ADDITIVE and NON-DESTRUCTIVE. Paste into the Supabase SQL Editor and run.
-- Expected audit baseline: user_credits = 2, credit_transactions = 38.
`;

for (const file of orderedFiles) {
  const sql = fs.readFileSync(path.join(schemaDir, file), "utf-8");
  out += `\n-- ===========================================================================\n-- SOURCE: ${file}\n-- ===========================================================================\n${sql}\n`;
}

out += `
do $$
begin
  raise notice 'CREDIT ENGINE MIGRATION COMPLETE: wallets=%, transactions=%',
    (select count(*) from public.user_credits),
    (select count(*) from public.credit_transactions);
end;
$$;
`;

fs.writeFileSync(outFile, out);
console.log(`Wrote ${outFile} (${out.length} chars)`);
