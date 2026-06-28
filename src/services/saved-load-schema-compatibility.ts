export const SAVED_LOAD_SNAPSHOT_SCHEMA_WARNING =
  "Load saved, but fuel/equipment snapshots could not be attached because the live Supabase schema is missing saved-load snapshot columns. The load will still appear on the Loads page; run the approved Supabase reconciliation before relying on snapshot-specific reporting.";

const OPTIONAL_SAVED_LOAD_SNAPSHOT_COLUMNS = [
  "fuel_gauge_snapshot",
  "equipment_context_snapshot",
] as const;

export function isMissingSavedLoadSnapshotColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  const errorText = [
    maybeError.message,
    maybeError.details,
    maybeError.hint,
    maybeError.code,
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (!errorText) {
    return false;
  }

  const mentionsOptionalSnapshotColumn =
    OPTIONAL_SAVED_LOAD_SNAPSHOT_COLUMNS.some((column) =>
      errorText.includes(column)
    );
  const isSchemaCacheError =
    maybeError.code === "PGRST204" ||
    errorText.includes("schema cache") ||
    errorText.includes("could not find") ||
    errorText.includes("column");

  return mentionsOptionalSnapshotColumn && isSchemaCacheError;
}

export function omitSavedLoadSnapshotColumns(payload: Record<string, unknown>) {
  const corePayload = { ...payload };

  delete corePayload.fuel_gauge_snapshot;
  delete corePayload.equipment_context_snapshot;

  return corePayload;
}
