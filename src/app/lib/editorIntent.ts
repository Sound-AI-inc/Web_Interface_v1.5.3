import type { ResultKind } from "../data/mock";

const STORAGE_KEY = "soundai:editor-intent";

export interface EditorIntent {
  assetId: string;
  kind: ResultKind;
  title: string;
  chatId?: string;
  projectId?: string;
}

export function setEditorIntent(intent: EditorIntent) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
}

export function consumeEditorIntent(): EditorIntent | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as EditorIntent;
  } catch {
    return null;
  }
}

export function kindToEditorTab(kind: ResultKind): "audio" | "midi" | "synth" {
  if (kind === "midi") return "midi";
  if (kind === "preset") return "synth";
  return "audio";
}
