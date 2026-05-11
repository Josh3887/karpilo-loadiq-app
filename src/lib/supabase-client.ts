import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase-env";

export function createClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL and publishable key are required. Check .env.local."
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
