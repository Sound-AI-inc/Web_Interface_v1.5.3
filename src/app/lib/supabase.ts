import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!url || !anon) return null;
  _client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _client;
}

export function supabaseConfigured(): boolean {
  return Boolean(url && anon);
}

export const supabaseUrl = url ?? null;
