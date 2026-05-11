import { createClient } from "@/lib/supabase-client";
import { loadInputSchema, LoadInputFormValues } from "@/lib/load-schema";

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Unknown Supabase error.";
  }

  const maybeError = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };

  return [
    maybeError.message,
    maybeError.details,
    maybeError.hint,
    maybeError.code,
  ]
    .filter(Boolean)
    .join(" | ");
}

export async function getSavedLoadInput(loadId: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(formatSupabaseError(userError));
  }

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("saved_loads")
    .select("input_snapshot")
    .eq("id", loadId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error(formatSupabaseError(error));
  }

  const parsed = loadInputSchema.safeParse(data.input_snapshot);

  if (!parsed.success) {
    throw new Error("Saved load input is not compatible with this calculator version.");
  }

  return parsed.data satisfies LoadInputFormValues;
}
