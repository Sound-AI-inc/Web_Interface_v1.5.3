const STORAGE_KEY = "soundai:composer-prefill";

export interface ComposerPrefill {
  prompt: string;
  type?: string;
}

export function setComposerPrefill(data: ComposerPrefill) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function consumeComposerPrefill(): ComposerPrefill | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as ComposerPrefill;
  } catch {
    return null;
  }
}
