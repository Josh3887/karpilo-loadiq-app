import { createClient } from "@/lib/supabase-client";
import { loadInputSchema, LoadInputFormValues } from "@/lib/load-schema";

export type DeadheadContinuitySuggestion = {
  sourceLoadId: string;
  sourceLabel: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  formattedAddress: string;
  suggestedOriginOdometer?: number;
};

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

export async function getDeadheadContinuitySuggestion(): Promise<DeadheadContinuitySuggestion | null> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(formatSupabaseError(userError));
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("saved_loads")
    .select(
      "id, loadiq_load_number, driver_load_number, status, load_run_status, was_run_status, delivery_city, delivery_state, delivery_zip, input_snapshot, actuals_snapshot, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data) {
    throw new Error(formatSupabaseError(error));
  }

  for (const load of data) {
    const status = String(load.status ?? "");
    const runStatus = String(load.load_run_status ?? load.was_run_status ?? "");

    if (!isContinuityCandidate(status, runStatus)) {
      continue;
    }

    const inputSnapshot = load.input_snapshot as Partial<LoadInputFormValues> | null;
    const actualsSnapshot = load.actuals_snapshot as {
      endOdometer?: number;
      odometerValidation?: {
        endOdometer?: number;
      };
    } | null;
    const address = inputSnapshot?.deliveryAddress?.trim() ?? "";
    const city =
      inputSnapshot?.deliveryCity?.trim() ?? load.delivery_city?.trim() ?? "";
    const state =
      inputSnapshot?.deliveryState?.trim() ?? load.delivery_state?.trim() ?? "";
    const zip =
      inputSnapshot?.deliveryZip?.trim() ?? load.delivery_zip?.trim() ?? "";
    const formattedAddress = [address, city, state, zip]
      .filter(Boolean)
      .join(", ");

    if (!formattedAddress) {
      continue;
    }

    const suggestedOriginOdometer = positiveNumber(
      actualsSnapshot?.odometerValidation?.endOdometer ??
        actualsSnapshot?.endOdometer
    );

    return {
      sourceLoadId: String(load.id),
      sourceLabel:
        load.driver_load_number ||
        load.loadiq_load_number ||
        `load from ${new Date(String(load.created_at)).toLocaleDateString()}`,
      address,
      city,
      state,
      zip,
      formattedAddress,
      suggestedOriginOdometer,
    };
  }

  return null;
}

function isContinuityCandidate(status: string, runStatus: string) {
  return (
    ["saved", "accepted", "completed"].includes(status) ||
    ["running", "ran"].includes(runStatus)
  );
}

function positiveNumber(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;

  return numeric;
}
