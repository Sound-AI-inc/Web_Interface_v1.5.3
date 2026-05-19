import type { SupabaseClient } from "@supabase/supabase-js";
import { logGenerationEvent } from "../../src/app/lib/ai/logging";
import type { GenerationLogEvent } from "../../src/app/lib/ai/types";

export async function recordGenerationMetric(
  supabase: SupabaseClient | null,
  event: GenerationLogEvent,
): Promise<void> {
  try {
    await logGenerationEvent(supabase, event);
  } catch {
    // Monitoring failures must not leak details or break request handling.
  }
}
