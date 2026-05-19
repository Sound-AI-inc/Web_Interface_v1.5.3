import type { GenerationLogEvent } from "./types";

type SupabaseInsertClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
  };
};

export function sanitizeGenerationLog(event: GenerationLogEvent): Record<string, unknown> {
  return {
    user_id: event.user_id,
    model_id: event.model_id,
    tier: event.tier,
    latency_ms: event.latency_ms,
    status: event.status,
    error_code: event.error_code ?? null,
  };
}

export async function logGenerationEvent(
  supabase: SupabaseInsertClient | null,
  event: GenerationLogEvent,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("generation_logs").insert(sanitizeGenerationLog(event));

  if (error) {
    throw new Error(`Failed to write generation log: ${error.message}`);
  }
}
