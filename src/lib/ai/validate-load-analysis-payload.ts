import type { LoadIqAiLoadAnalysisInput } from "@/types/ai-load-analysis";

const REQUIRED_NUMERIC_FIELDS = [
  "grossRevenue",
  "loadedMiles",
  "deadheadMiles",
  "fuelCost",
  "trueRpm",
  "netProfit",
  "daysCommitted",
] as const satisfies readonly (keyof LoadIqAiLoadAnalysisInput)[];

const OPTIONAL_NUMERIC_FIELDS = [
  "dispatchFee",
  "factoringFee",
  "tolls",
  "accessorials",
  "estimatedMaintenanceReserve",
] as const satisfies readonly (keyof LoadIqAiLoadAnalysisInput)[];

const OPTIONAL_TEXT_FIELDS = [
  "pickupRegion",
  "deliveryRegion",
  "notes",
] as const satisfies readonly (keyof LoadIqAiLoadAnalysisInput)[];

const NON_NEGATIVE_FIELDS = new Set<keyof LoadIqAiLoadAnalysisInput>([
  "grossRevenue",
  "loadedMiles",
  "deadheadMiles",
  "fuelCost",
  "trueRpm",
  "daysCommitted",
  "dispatchFee",
  "factoringFee",
  "tolls",
  "accessorials",
  "estimatedMaintenanceReserve",
]);

const MAX_ABSOLUTE_VALUE = 100_000_000;
const MAX_MILES_OR_DAYS = 1_000_000;
const MAX_TEXT_LENGTH = 280;
const MAX_NOTES_LENGTH = 600;

export type LoadAnalysisPayloadValidation =
  | {
      ok: true;
      value: LoadIqAiLoadAnalysisInput;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateNumber(
  key: keyof LoadIqAiLoadAnalysisInput,
  value: unknown,
  required: boolean
) {
  if (value === undefined || value === null) {
    return required ? `${String(key)} is required.` : null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `${String(key)} must be a finite number.`;
  }

  if (NON_NEGATIVE_FIELDS.has(key) && value < 0) {
    return `${String(key)} cannot be negative.`;
  }

  const maxValue =
    key === "loadedMiles" || key === "deadheadMiles" || key === "daysCommitted"
      ? MAX_MILES_OR_DAYS
      : MAX_ABSOLUTE_VALUE;

  if (Math.abs(value) > maxValue) {
    return `${String(key)} is outside the supported range.`;
  }

  return null;
}

function sanitizeText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength) || undefined;
}

export function validateLoadAnalysisPayload(
  payload: unknown
): LoadAnalysisPayloadValidation {
  if (!isRecord(payload)) {
    return { ok: false, error: "Payload must be a JSON object." };
  }

  const value: Partial<LoadIqAiLoadAnalysisInput> = {};

  for (const field of REQUIRED_NUMERIC_FIELDS) {
    const error = validateNumber(field, payload[field], true);
    if (error) return { ok: false, error };
    value[field] = payload[field] as number;
  }

  for (const field of OPTIONAL_NUMERIC_FIELDS) {
    const error = validateNumber(field, payload[field], false);
    if (error) return { ok: false, error };

    if (payload[field] !== undefined && payload[field] !== null) {
      value[field] = payload[field] as number;
    }
  }

  for (const field of OPTIONAL_TEXT_FIELDS) {
    const maxLength = field === "notes" ? MAX_NOTES_LENGTH : MAX_TEXT_LENGTH;
    const sanitized = sanitizeText(payload[field], maxLength);

    if (sanitized) {
      value[field] = sanitized;
    }
  }

  return {
    ok: true,
    value: value as LoadIqAiLoadAnalysisInput,
  };
}
