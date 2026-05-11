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

async function getCurrentUserId() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  if (!user) {
    throw new Error("User not authenticated.");
  }

  return user.id;
}

export async function createLaneTemplateFromSavedLoad(loadId: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data: load, error: loadError } = await supabase
    .from("saved_loads")
    .select("pickup_zip, delivery_zip, input_snapshot")
    .eq("id", loadId)
    .eq("user_id", userId)
    .single();

  if (loadError || !load) {
    throw new Error(formatSupabaseError(loadError));
  }

  const parsed = loadInputSchema.safeParse(load.input_snapshot);

  if (!parsed.success) {
    throw new Error("Saved load input is not compatible with lane templates.");
  }

  const { error } = await supabase.from("lane_templates").insert({
    user_id: userId,
    name: `${load.pickup_zip} to ${load.delivery_zip}`,
    pickup_zip: load.pickup_zip,
    delivery_zip: load.delivery_zip,
    input_snapshot: parsed.data,
  });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function getLaneTemplateInput(templateId: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("lane_templates")
    .select("input_snapshot")
    .eq("id", templateId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error(formatSupabaseError(error));
  }

  const parsed = loadInputSchema.safeParse(data.input_snapshot);

  if (!parsed.success) {
    throw new Error("Lane template is not compatible with this calculator version.");
  }

  return parsed.data satisfies LoadInputFormValues;
}

export async function deleteLaneTemplate(templateId: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("lane_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}
