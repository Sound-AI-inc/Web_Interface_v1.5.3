#!/usr/bin/env node
/**
 * P4-B — `npm run providers:check`
 * Validates provider configuration (env presence) and the generation
 * contract fixtures. Reports honestly; exits non-zero when anything is
 * missing or invalid. No network I/O, no secrets required.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv(paths) {
  const env = {};
  for (const path of paths) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
    }
  }
  return env;
}

const fileEnv = loadDotEnv([join(root, ".env"), join(root, ".dev.vars")]);
const env = (name) => (process.env[name] ?? fileEnv[name] ?? "").trim();

const EXPECTED_VARS = [
  ["VITE_AI_GENERATION_API_URL", "orchestration endpoint (or same-origin /api/generate default)"],
  ["VITE_SOUNDCRAFT_API_URL", "SoundCraft audio provider"],
  ["VITE_MIDICRAFT_API_URL", "MidiCraft MIDI provider"],
  ["VITE_VSTCRAFT_API_URL", "VSTCraft preset provider"],
  ["VITE_MUSCRAFT_API_URL", "MusCraft future provider (expected unset)"],
];

let failures = 0;
console.log("Provider configuration check\n");

for (const [name, description] of EXPECTED_VARS) {
  const value = env(name);
  const expectedUnset = name === "VITE_MUSCRAFT_API_URL";
  if (value) {
    console.log(`  [set]     ${name}=${value}  (${description})`);
    if (expectedUnset) console.log("          note: MusCraft has no registered models yet.");
  } else if (expectedUnset) {
    console.log(`  [unset]   ${name}  (${description}) — OK, reported as unavailable.`);
  } else {
    console.log(`  [missing] ${name}  (${description})`);
    failures += 1;
  }
}

// Server-managed Hugging Face values must never appear client-side.
const leaked = ["VITE_HF_API_KEY", "VITE_HUGGINGFACE_API_KEY"].filter((name) => env(name));
if (leaked.length > 0) {
  console.log(`\n  [LEAK] client-exposed secret vars present: ${leaked.join(", ")}`);
  failures += leaked.length;
} else {
  console.log("\n  [ok] no client-exposed HF secrets.");
}

// Contract fixtures: every case present, shapes sane.
const fixturePath = join(root, "scripts", "fixtures", "providers.json");
try {
  const fixtures = JSON.parse(readFileSync(fixturePath, "utf8"));
  const cases = fixtures.cases ?? [];
  const required = ["success", "unavailable", "invalid", "timeout", "malformed", "partial", "credits"];
  const kinds = new Set(cases.map((c) => c.kind));
  for (const kind of required) {
    if (kinds.has(kind)) {
      console.log(`  [ok] fixture kind present: ${kind}`);
    } else {
      console.log(`  [missing] fixture kind: ${kind}`);
      failures += 1;
    }
  }
  for (const c of cases) {
    if (c.kind === "success" || c.kind === "partial" || c.kind === "malformed") {
      const assets = c.response?.assets;
      if (!Array.isArray(assets)) {
        console.log(`  [invalid] fixture "${c.name}" has no assets array.`);
        failures += 1;
      }
    }
    if ((c.kind === "invalid" || c.kind === "timeout" || c.kind === "credits") && !c.raw) {
      console.log(`  [invalid] fixture "${c.name}" needs a raw error string.`);
      failures += 1;
    }
  }
} catch (error) {
  console.log(`  [error] cannot read fixtures: ${error.message}`);
  failures += 1;
}

console.log(failures === 0 ? "\nAll provider checks passed." : `\n${failures} check(s) failed — see above.`);
process.exit(failures === 0 ? 0 : 1);