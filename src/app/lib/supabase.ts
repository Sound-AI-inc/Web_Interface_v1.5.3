import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) {
    return client;
  }

  if (!url || !anonKey) {
    return null;
  }

  client = createClient(url, anonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}

export function createSupabase(): SupabaseClient | null {
  return getSupabase();
}

export function supabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export const supabaseUrl = url ?? null;
