import type { AudioResult, DemoAssetMetadata } from "../data/contracts";
import { generateFromPrompt, matchGenerationTemplates, type GenerationType } from "./promptGeneration";

export interface GenerationGatewayRequest {
  prompt: string;
  mode: "lite" | "pro";
  type: GenerationType;
  model: string;
  format: string;
  count: number;
}

export interface GenerationGatewayResponse {
  items: AudioResult[];
  source: "backend" | "demo";
  backendTarget?: "soundcraft" | "midicraft" | "vstcraft";
  warning?: string;
}

const SOUNDCRAFT_API_URL = import.meta.env.VITE_SOUNDCRAFT_API_URL as string | undefined;
const MIDICRAFT_API_URL = import.meta.env.VITE_MIDICRAFT_API_URL as string | undefined;
const VSTCRAFT_API_URL = import.meta.env.VITE_VSTCRAFT_API_URL as string | undefined;

function toDemo(request: GenerationGatewayRequest, warning?: string): GenerationGatewayResponse {
  const fallbackWarning =
    warning ??
    (request.type === "Audio Sample"
      ? "Preview is running in metadata-guided demo mode until backend audio assets are connected."
      : undefined);

  return {
    items: generateFromPrompt(request),
    source: "demo",
    warning: fallbackWarning,
  };
}

function normalizeBaseUrl(url: string | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, "");
}

async function postJson<TResponse>(url: string, payload: object): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

function buildPromptContext(prompt: string, type: GenerationType) {
  const template = matchGenerationTemplates(type, prompt)[0];
  const metadata = template?.metadata;
  return {
    template,
    bpm: metadata?.bpm ?? undefined,
    key: metadata?.key ?? undefined,
    genre: metadata?.genre ?? undefined,
    style: metadata?.soundType ?? metadata?.mood ?? undefined,
    bars: Math.max(2, Math.round((template?.durationSeconds ?? 6) / 2)),
  };
}

function backendMetadata(
  fallbackId: string,
  metadata: DemoAssetMetadata | undefined,
  overrides: Partial<DemoAssetMetadata>,
): DemoAssetMetadata {
  return {
    assetId: metadata?.assetId ?? fallbackId,
    ...metadata,
    ...overrides,
  };
}

async function requestSoundCraft(request: GenerationGatewayRequest): Promise<GenerationGatewayResponse> {
  const baseUrl = normalizeBaseUrl(SOUNDCRAFT_API_URL);
  if (!baseUrl || request.count !== 1) {
    return toDemo(request, request.count !== 1 ? "SoundCraft API currently falls back to demo for multi-variant requests." : undefined);
  }

  const context = buildPromptContext(request.prompt, request.type);
  type SoundCraftResponse = {
    success: boolean;
    audio_url: string;
    metadata: {
      bpm?: number;
      key?: string;
      duration: number;
      format?: string;
      generation_id?: string;
      sample_name?: string;
    };
    message?: string;
  };

  try {
    const result = await postJson<SoundCraftResponse>(`${baseUrl}/generate-audio`, {
      prompt: request.prompt,
      duration: context.template?.durationSeconds ?? 6,
      bpm: context.bpm,
      key: context.key,
      style: context.genre,
    });

    return {
      items: [
        {
          id: result.metadata.generation_id ?? `soundcraft-${Date.now()}`,
          title: result.metadata.sample_name ?? "Generated Audio Sample",
          model: request.model,
          kind: "audio",
          durationSeconds: result.metadata.duration ?? context.template?.durationSeconds ?? 6,
          format: request.format,
          description: result.message ?? `Backend-generated audio for "${request.prompt}"`,
          tags: [context.genre ?? "audio", context.style ?? "sample"].filter(Boolean),
          audioSeed: Date.now(),
          waveformHue: context.template?.waveformHue,
          metadata: backendMetadata(`soundcraft-${Date.now()}`, context.template?.metadata, {
            assetUrl: result.audio_url,
            previewUrl: result.audio_url,
            bpm: result.metadata.bpm ?? context.bpm,
            key: result.metadata.key ?? context.key,
            format: result.metadata.format ?? request.format,
            generatedFrom: "soundcraft-api",
          }),
        },
      ],
      source: "backend",
      backendTarget: "soundcraft",
    };
  } catch (error) {
    return toDemo(
      request,
      `SoundCraft API fallback: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

async function requestMidiCraft(request: GenerationGatewayRequest): Promise<GenerationGatewayResponse> {
  const baseUrl = normalizeBaseUrl(MIDICRAFT_API_URL);
  if (!baseUrl) return toDemo(request);

  const context = buildPromptContext(request.prompt, request.type);
  type MidiCraftResponse = {
    prompt: string;
    candidates: Array<{
      id: string;
      title: string;
      download_url: string;
      metadata: {
        bpm: number;
        key: string;
        genre: string;
        style: string;
        bars: number;
        format: string;
        duration_seconds: number;
      };
    }>;
  };

  try {
    const result = await postJson<MidiCraftResponse>(`${baseUrl}/generate`, {
      prompt: request.prompt,
      style: context.style,
      genre: context.genre,
      bpm: context.bpm,
      key: context.key,
      bars: context.bars,
      variant_count: request.count,
    });

    if (!Array.isArray(result.candidates) || result.candidates.length === 0) {
      return toDemo(request, "MidiCraft API returned no candidates.");
    }

    return {
      items: result.candidates.map((candidate, index) => ({
        id: candidate.id || `midicraft-${Date.now()}-${index}`,
        title: candidate.title,
        model: request.model,
        kind: "midi",
        durationSeconds: candidate.metadata.duration_seconds ?? context.template?.durationSeconds ?? 6,
        format: request.format,
        description: `Backend-generated MIDI for "${request.prompt}"`,
        tags: [candidate.metadata.genre, candidate.metadata.style].filter(Boolean),
        notes: generateFromPrompt({ ...request, count: 1 })[0]?.notes,
        metadata: backendMetadata(candidate.id || `midicraft-${Date.now()}-${index}`, context.template?.metadata, {
          assetUrl: candidate.download_url,
          previewUrl: candidate.download_url,
          bpm: candidate.metadata.bpm,
          key: candidate.metadata.key,
          genre: candidate.metadata.genre,
          soundType: candidate.metadata.style,
          format: candidate.metadata.format ?? request.format,
          generatedFrom: "midicraft-api",
        }),
      })),
      source: "backend",
      backendTarget: "midicraft",
    };
  } catch (error) {
    return toDemo(
      request,
      `MidiCraft API fallback: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

async function requestVSTCraft(request: GenerationGatewayRequest): Promise<GenerationGatewayResponse> {
  const baseUrl = normalizeBaseUrl(VSTCRAFT_API_URL);
  if (!baseUrl) return toDemo(request);

  const context = buildPromptContext(request.prompt, request.type);
  type VSTCraftResponse = {
    preset_name?: string;
    export_format?: string;
  };

  try {
    const result = await postJson<VSTCraftResponse>(`${baseUrl}/generate`, {
      text: request.prompt,
      output_format: request.format,
      preset_name: context.template?.title,
      bank_size: request.count,
      write_files: false,
    });

    const demoItems = generateFromPrompt(request);
    return {
      items: demoItems.map((item, index) => ({
        ...item,
        title: index === 0 && result.preset_name ? result.preset_name : item.title,
        metadata: backendMetadata(item.metadata?.assetId ?? `vstcraft-${Date.now()}-${index}`, item.metadata, {
          format: result.export_format ?? request.format,
          generatedFrom: "vstcraft-api",
        }),
      })),
      source: "backend",
      backendTarget: "vstcraft",
    };
  } catch (error) {
    return toDemo(
      request,
      `VSTCraft API fallback: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

export async function generateResults(request: GenerationGatewayRequest): Promise<GenerationGatewayResponse> {
  if (request.type === "Audio Sample") return requestSoundCraft(request);
  if (request.type === "MIDI Melody") return requestMidiCraft(request);
  return requestVSTCraft(request);
}
