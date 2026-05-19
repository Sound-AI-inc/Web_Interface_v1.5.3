export function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error("SERVER_RUNTIME_REQUIRED");
  }
}
