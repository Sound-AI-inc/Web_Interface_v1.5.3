#!/usr/bin/env node
/**
 * `npm run providers:smoke`
 * Runs a single smoke generation request against each configured provider
 * via the local worker (/api/generate). Validates the full path:
 * client → worker → provider adapter → inference endpoint → response parsing.
 * Exits non-zero if any smoke test fails.
 * Requires: local dev server running on http://localhost:8787 (wrangler dev)
 * and valid server-side credentials.
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
const getEnv = (name) => (process.env[name] ?? fileEnv[name] ?? "").trim();

const BASE_URL = getEnv("VITE_AI_GENERATION_API_URL") || "http://localhost:8787";

const SMOKE_TESTS = [
  {
    name: "SoundCraft",
    assetType: "audio",
    model: "SoundCraft",
    format: "WAV",
    mode: "pro",
    prompt: "short test sound",
    minCredits: 1,
  },
  {
    name: "MidiCraft",
    assetType: "midi",
    model: "MidiCraft",
    format: "MIDI",
    mode: "pro",
    prompt: "simple melody",
    minCredits: 1,
  },
  {
    name: "VSTCraft",
    assetType: "vst_preset",
    model: "VSTCraft",
    format: "VST3 (.vstpreset)",
    mode: "pro",
    prompt: "basic pad",
    minCredits: 1,
  },
  {
    name: "HuggingFaceLite",
    assetType: "audio",
    model: "facebook/musicgen-small",
    format: "MP3",
    mode: "lite",
    prompt: "ambient tone",
    minCredits: 1,
  },
];

async function runSmokeTest(test) {
  const requestId = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const generationId = `gen-${Date.now()}`;

  const payload = {
    requestId,
    generationId,
    userId: "smoke-test-user",
    projectId: null,
    assetType: test.assetType,
    prompt: test.prompt,
    model: test.model,
    count: 1,
    format: test.format,
    mode: test.mode,
    parameters: {},
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${data.error?.message || JSON.stringify(data)}` };
    }

    if (!data.assets || !Array.isArray(data.assets) || data.assets.length === 0) {
      return { success: false, error: "No assets returned" };
    }

    if (data.status !== "completed" && data.status !== "preview") {
      return { success: false, error: `Unexpected status: ${data.status}` };
    }

    const asset = data.assets[0];
    if (!asset.url && !asset.previewUrl) {
      return { success: false, error: "Asset missing URL" };
    }

    return { success: true, asset: asset.name, url: asset.url || asset.previewUrl };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Request failed" };
  }
}

async function main() {
  console.log(`Provider smoke tests against ${BASE_URL}\n`);
  let anyConfigured = false;
  let anyFailed = false;

  for (const test of SMOKE_TESTS) {
    const hasConfig = test.name === "SoundCraft" || test.name === "MidiCraft" || test.name === "VSTCraft"
      ? !!getEnv("SOUNDAI_INTERNAL_INFERENCE_URL")
      : test.name === "HuggingFaceLite"
      ? !!(getEnv("HF_API_KEY") && (getEnv("HUGGINGFACE_INFERENCE_BASE_URL") || getEnv("SOUNDAI_INTERNAL_INFERENCE_URL")))
      : false;

    if (!hasConfig) {
      console.log(`  [skip]   ${test.name} — not configured`);
      continue;
    }

    anyConfigured = true;
    console.log(`  [run]    ${test.name}...`);
    const result = await runSmokeTest(test);

    if (result.success) {
      console.log(`  [ok]     ${test.name} → ${result.asset} (${result.url})`);
    } else {
      console.log(`  [fail]   ${test.name} — ${result.error}`);
      anyFailed = true;
    }
  }

  if (!anyConfigured) {
    console.log("\nNo providers configured for smoke tests.");
    console.log("Set SOUNDAI_INTERNAL_INFERENCE_URL, HF_API_KEY, etc.");
    process.exit(0);
  }

  console.log(anyFailed ? "\nSome smoke tests failed." : "\nAll smoke tests passed.");
  process.exit(anyFailed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});