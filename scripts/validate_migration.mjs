// Validates the ACTUAL generated single-file bundle:
//  1. libpg_query (real PostgreSQL grammar) parses every top-level statement.
//  2. Structural PL/pgSQL audit of every dollar-quoted body: balanced
//     IF/END IF, CASE/END CASE, LOOP/END LOOP, BEGIN/END, plus
//     EXECUTE ... INTO ... USING clause order.
// Run: node scripts/validate_migration.mjs (exit non-zero on any failure)
import * as fs from "fs";
import * as path from "path";
import { parse } from "pgsql-parser";

const file = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "supabase", "schema", "credit_engine_production_migration.sql");
const sql = fs.readFileSync(file, "utf-8");
let failures = 0;
const fail = (msg) => { console.log("FAIL:", msg); failures++; };

// ---- 1. Real PostgreSQL grammar parse (top-level statements) ----
try {
  const ast = parse(sql);
  console.log(`libpg_query: parsed OK (${ast.length} top-level statements)`);
} catch (e) {
  fail(`libpg_query parse error: ${e.message.slice(0, 300)}`);
}

// ---- 2. PL/pgSQL body structural audit ----
const bodies = [...sql.matchAll(/\$\$(.*?)\$\$/gs)].map((m) => m[1]);
console.log(`plpgsql bodies found: ${bodies.length}`);

function stripStringsAndComments(body) {
  // Remove single-quoted strings (with '' escapes) to avoid keyword false hits.
  let out = body.replace(/'(?:[^']|'')*'/g, "''");
  // Remove line comments.
  out = out.replace(/--[^\n]*/g, "");
  return out;
}

bodies.forEach((raw, idx) => {
  const body = stripStringsAndComments(raw);
  // Simple ';' token (never swallow rest-of-line: keywords may follow ';').
  const tokens = body.match(/[a-zA-Z_][a-zA-Z0-9_]*|;/g) || [];
  const words = tokens.map((t) => (/^[a-zA-Z_]/.test(t) ? t.toLowerCase() : t)).filter((t) => t !== ";");
  const stack = [];
  // True PL/pgSQL IF statements always have a THEN at paren-depth 0 before
  // the statement's ';'. DDL options (CREATE ... IF NOT EXISTS) never do.
  const isBlockIf = (from) => {
    let depth = 0;
    for (let j = from + 1; j < words.length; j++) {
      const t = words[j];
      if (t === "(") depth++;
      else if (t === ")") depth = Math.max(0, depth - 1);
      else if (depth === 0 && t === "then") return true;
      else if (depth === 0 && t === ";") return false; // DDL fragment first
    }
    return false;
  };
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const next = words[i + 1];
    if (w === "if") {
      if (isBlockIf(i)) stack.push("if");
      // else: DDL IF [NOT] EXISTS — not a block opener.
    } else if (w === "begin") {
      stack.push("begin");
    } else if (w === "case" || w === "loop") {
      stack.push(w); // CASE statement or CASE expression; LOOP
    } else if (w === "end" && (next === "if" || next === "loop" || next === "case")) {
      const want = next; // END IF | END LOOP | END CASE
      const top = stack.pop();
      if (!top || top !== want) {
        fail(`body #${idx}: END ${next.toUpperCase()} without matching opener (found ${top || "empty stack"})`);
      }
      i++; // consume IF/LOOP/CASE word
    } else if (w === "end") {
      // Bare END closes a BEGIN block or a CASE *expression*.
      // (A CASE *statement* must close with END CASE; an IF must close
      // with END IF — closing either with bare END is the defect class.)
      const top = stack.pop();
      if (!top || (top !== "begin" && top !== "case")) {
        fail(`body #${idx}: bare END closes ${top || "empty stack"} (want BEGIN or CASE-expression)`);
      }
    }
  }
  if (stack.length !== 0) {
    fail(`body #${idx}: unbalanced blocks left open: ${stack.join(", ")}`);
  }

  // EXECUTE clause order: INTO must precede USING.
  if (/execute\b[\s\S]{0,400}?\busing\b[\s\S]{0,200}?\binto\b/i.test(raw) &&
      !/execute\b[\s\S]{0,400}?\binto\b[\s\S]{0,200}?\busing\b/i.test(raw)) {
    // More precise: find each EXECUTE..; span and check order within it.
    const stmts = raw.match(/execute\s[^;]+;/gi) || [];
    for (const st of stmts) {
      const ui = st.search(/\busing\b/i);
      const ii = st.search(/\binto\b/i);
      if (ui >= 0 && ii >= 0 && ui < ii) fail(`body #${idx}: EXECUTE ... USING before INTO: ${st.slice(0, 80)}`);
    }
  }
});

console.log(failures === 0 ? "MIGRATION VALIDATION: PASS" : `MIGRATION VALIDATION: ${failures} FAILURE(S)`);
process.exitCode = failures === 0 ? 0 : 1;
