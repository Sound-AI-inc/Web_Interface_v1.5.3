#!/usr/bin/env node
/**
 * `npm run providers:health`
 * Performs live health checks against configured provider endpoints.
 * Requires server-side env vars (HF_API_KEY, RUNPOD_API_KEY, etc.) to be set.
 * Exits non-zero if any configured provider is unhealthy.
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

const PROVIDERS = [
  {
    name: "SoundCraft",
    check: async () => {
      const baseUrl = getEnv("SOUNDAI_INTERNAL_INFERENCE_URL")?.replace(/\/$/, "");
      if (!baseUrl) return { healthy: false, reason: "SOUNDAI_INTERNAL_INFERENCE_URL not set" };
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        return { healthy: response.ok, reason: response.ok ? "OK" : `HTTP ${response.status}` };
      } catch (e) {
        return { healthy: false, reason: e instanceof Error ? e.message : "Request failed" };
      }
    },
  },
  {
    name: "MidiCraft",
    check: async () => {
      const baseUrl = getEnv("SOUNDAI_INTERNAL_INFERENCE_URL")?.replace(/\/$/, "");
      if (!baseUrl) return { healthy: false, reason: "SOUNDAI_INTERNAL_INFERENCE_URL not set" };
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        return { healthy: response.ok, reason: response.ok ? "OK" : `HTTP ${response.status}` };
      } catch (e) {
        return { healthy: false, reason: e instanceof Error ? e.message : "Request failed" };
      }
    },
  },
  {
    name: "VSTCraft",
    check: async () => {
      const baseUrl = getEnv("SOUNDAI_INTERNAL_INFERENCE_URL")?.replace(/\/$/, "");
      if (!baseUrl) return { healthy: false, reason: "SOUNDAI_INTERNAL_INFERENCE_URL not set" };
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        return { healthy: response.ok, reason: response.ok ? "OK" : `HTTP ${response.status}` };
      } catch (e) {
        return { healthy: false, reason: e instanceof Error ? e.message : "Request failed" };
      }
    },
  },
  {
    name: "HuggingFaceLite",
    check: async () => {
      const hfApiKey = getEnv("HF_API_KEY");
      const hfInferenceBaseUrl = (getEnv("HUGGINGFACE_INFERENCE_BASE_URL") || "https://api-inference.huggingface.co").replace(/\/$/, "");
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${hfInferenceBaseUrl}/models/facebook/musicgen-small`, {
          method: "HEAD",
          headers: { ...(hfApiKey ? { Authorization: `Bearer ${hfApiKey}` } : {}) },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.ok || response.status === 404) return { healthy: true, reason: "OK" };
        if (response.status === 401 || response.status === 403) return { healthy: false, reason: "Authentication failed" };
        return { healthy: false, reason: `HTTP ${response.status}` };
      } catch (e) {
        return { healthy: false, reason: e instanceof Error ? e.message : "Request failed" };
      }
    },
  },
  {
    name: "RunPod",
    check: async () => {
      const runpodApiKey = getEnv("RUNPOD_API_KEY");
      const runpodApiUrl = getEnv("RUNPOD_API_URL")?.replace(/\/$/, "");
      if (!runpodApiUrl) return { healthy: false, reason: "RUNPOD_API_URL not set" };
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${runpodApiUrl}/health`, {
          headers: { ...(runpodApiKey ? { Authorization: `Bearer ${runpodApiKey}` } : {}) },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return { healthy: response.ok, reason: response.ok ? "OK" : `HTTP ${response.status}` };
      } catch (e) {
        return { healthy: false, reason: e instanceof Error ? e.message : "Request failed" };
      }
    },
  },
];

async function main() {
  console.log("Provider health checks\n");
  let anyConfigured = false;
  let anyFailed = false;

  for (const provider of PROVIDERS) {
    const hasConfig = provider.name === "SoundCraft" || provider.name === "MidiCraft" || provider.name === "VSTCraft"
      ? !!getEnv("SOUNDAI_INTERNAL_INFERENCE_URL")
      : provider.name === "HuggingFaceLite"
      ? !!(getEnv("HUGGINGFACE_INFERENCE_BASE_URL") || getEnv("SOUNDAI_INTERNAL_INFERENCE_URL"))
      : provider.name === "RunPod"
      ? !!getEnv("RUNPOD_API_URL")
      : false;

    if (!hasConfig) {
      console.log(`  [skip]   ${provider.name} — not configured`);
      continue;
    }

    anyConfigured = true;
    const started = Date.now();
    const result = await provider.check();
    const latency = Date.now() - started;

    if (result.healthy) {
      console.log(`  [ok]     ${provider.name} (${latency}ms) — ${result.reason}`);
    } else {
      console.log(`  [fail]   ${provider.name} (${latency}ms) — ${result.reason}`);
      anyFailed = true;
    }
  }

  if (!anyConfigured) {
    console.log("\nNo providers configured with server-side credentials.");
    console.log("Set SOUNDAI_INTERNAL_INFERENCE_URL, HF_API_KEY, RUNPOD_API_URL, etc.");
    process.exit(0);
  }

  console.log(anyFailed ? "\nSome providers unhealthy." : "\nAll configured providers healthy.");
  process.exit(anyFailed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});