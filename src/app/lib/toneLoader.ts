let _toneModule: typeof import("tone") | null = null;

export async function loadTone(): Promise<typeof import("tone")> {
  if (!_toneModule) {
    _toneModule = await import("tone");
  }
  return _toneModule;
}
