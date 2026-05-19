import type { GenerationRequest, GenerationResult, ModelConfig } from "../types";
import { formatGenerationResult } from "../outputFormatter";
import { assertServerRuntime } from "../runtime";

type HFOptions = {
  apiKey?: string;
  endpointBaseUrl?: string;
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_HF_BASE_URL = "https://api-inference.huggingface.co/models";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function retryDelay(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  }

  return Math.min(1000 * 2 ** attempt, 8000);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `HF API returned HTTP ${response.status}`;

  try {
    const json = JSON.parse(text) as { error?: string };
    return json.error ?? text;
  } catch {
    return text;
  }
}

async function normalizeHFResponse(response: Response, modelConfig: ModelConfig, request: GenerationRequest): Promise<GenerationResult> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("audio/") || contentType.includes("application/octet-stream")) {
    const buffer = await response.arrayBuffer();
    const mimeType = contentType.split(";")[0] || "audio/wav";
    return formatGenerationResult(modelConfig, `data:${mimeType};base64,${arrayBufferToBase64(buffer)}`, request);
  }

  const json = (await response.json()) as unknown;
  if (typeof json === "string") {
    return formatGenerationResult(modelConfig, json, request);
  }

  if (Array.isArray(json)) {
    return formatGenerationResult(modelConfig, JSON.stringify(json), request);
  }

  if (json && typeof json === "object") {
    const payload = json as { audio?: string; url?: string; generated_text?: string; duration?: number };
    return formatGenerationResult(modelConfig, payload.audio ?? payload.url ?? payload.generated_text ?? JSON.stringify(payload), request, {
      duration: payload.duration ?? request.metadata?.duration,
    });
  }

  return formatGenerationResult(modelConfig, "", request);
}

export async function generateWithHF(
  modelConfig: ModelConfig,
  prompt: string,
  request: GenerationRequest,
  options: HFOptions = {},
): Promise<GenerationResult> {
  assertServerRuntime();

  if (modelConfig.provider !== "huggingface") {
    throw new Error(`Model ${modelConfig.id} is not a Hugging Face model.`);
  }

  const baseUrl = (options.endpointBaseUrl ?? DEFAULT_HF_BASE_URL).replace(/\/$/, "");
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/${modelConfig.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
        },
        body: JSON.stringify({
          inputs: prompt,
          options: { wait_for_model: true },
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        return normalizeHFResponse(response, modelConfig, request);
      }

      const retryable = response.status === 429 || response.status === 503 || response.status === 504;
      const message = await readError(response);
      if (!retryable || attempt === retries) throw new Error(message);

      await sleep(retryDelay(attempt, response.headers.get("retry-after")));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Hugging Face inference error");
      if (attempt === retries) break;
      await sleep(retryDelay(attempt, null));
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Hugging Face inference failed.");
}
