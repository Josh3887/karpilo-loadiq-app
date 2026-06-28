function normalizeSupabaseProjectUrl(value: string | undefined) {
  if (!value) return value;

  try {
    return new URL(value.trim()).origin;
  } catch {
    return value;
  }
}

export function getSupabaseUrl() {
  return normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
