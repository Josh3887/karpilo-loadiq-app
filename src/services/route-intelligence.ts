import { LoadInput, RouteStopInput } from "@/types/load";
import { toDateInputValue, toTimeInputValue } from "@/services/trip-dates";

export type SavedLoadStopType = "pickup" | "stop_off" | "delivery";

const DEFAULT_ROUTE_STOP_DWELL_HOURS = 2;

export type SavedLoadStopInsert = {
  saved_load_id?: string;
  user_id: string;
  stop_sequence: number;
  stop_type: SavedLoadStopType;
  city: string | null;
  state: string | null;
  zip: string | null;
  miles_from_previous: number | null;
  stop_revenue: number | null;
  stop_expense: number | null;
  notes: string | null;
};

export type SavedLoadStopRecord = SavedLoadStopInsert & {
  id?: string;
  saved_load_id: string;
  created_at?: string | null;
};

export function createRouteStopInput(): RouteStopInput {
  return {
    id: createRouteStopId(),
    stopType: "pickup",
    address: "",
    city: "",
    state: "",
    zip: "",
    appointmentDate: "",
    appointmentTime: "",
    appointmentWindowStartDate: "",
    appointmentWindowStart: "",
    appointmentWindowEndDate: "",
    appointmentWindowEnd: "",
    appointmentWindowOpenEnded: false,
    dwellHours: DEFAULT_ROUTE_STOP_DWELL_HOURS,
    milesFromPrevious: 0,
    stopRevenue: 0,
    stopExpense: 0,
    notes: "",
  };
}

export function normalizeRouteStops(
  stops: RouteStopInput[] | undefined
): RouteStopInput[] {
  return (stops ?? [])
    .map((stop) => ({
      id: stop.id || createRouteStopId(),
      stopType: normalizeStopKind(stop.stopType),
      address: stop.address?.trim() ?? "",
      city: stop.city?.trim() ?? "",
      state: stop.state?.trim().toUpperCase() ?? "",
      zip: stop.zip?.trim() ?? "",
      appointmentDate: toDateInputValue(stop.appointmentDate),
      appointmentTime: toTimeInputValue(stop.appointmentTime),
      appointmentWindowStartDate: toDateInputValue(
        stop.appointmentWindowStartDate
      ),
      appointmentWindowStart: toTimeInputValue(stop.appointmentWindowStart),
      appointmentWindowEndDate: toDateInputValue(stop.appointmentWindowEndDate),
      appointmentWindowEnd: toTimeInputValue(stop.appointmentWindowEnd),
      appointmentWindowOpenEnded: Boolean(stop.appointmentWindowOpenEnded),
      dwellHours: normalizeDwellHours(stop.dwellHours),
      milesFromPrevious: positiveNumber(stop.milesFromPrevious),
      stopRevenue: positiveNumber(stop.stopRevenue),
      stopExpense: positiveNumber(stop.stopExpense),
      notes: stop.notes?.trim() ?? "",
    }))
    .filter((stop) => {
      return Boolean(
        stop.city ||
          stop.address ||
          stop.state ||
          stop.zip ||
          stop.milesFromPrevious ||
          stop.stopRevenue ||
          stop.stopExpense ||
          stop.appointmentDate ||
          stop.appointmentTime ||
          stop.appointmentWindowStartDate ||
          stop.appointmentWindowStart ||
          stop.appointmentWindowEndDate ||
          stop.appointmentWindowEnd ||
          stop.appointmentWindowOpenEnded ||
          stop.dwellHours !== DEFAULT_ROUTE_STOP_DWELL_HOURS ||
          stop.notes
      );
    });
}

export function buildSavedLoadStopRows(
  input: LoadInput,
  userId: string
): SavedLoadStopInsert[] {
  const stopOffs = normalizeRouteStops(input.routeStops);
  const rows: SavedLoadStopInsert[] = [
    {
      user_id: userId,
      stop_sequence: 1,
      stop_type: "pickup",
      city: emptyToNull(input.pickupCity),
      state: emptyToNull(input.pickupState),
      zip: emptyToNull(input.pickupZip),
      miles_from_previous:
        hasDeadheadOrigin(input) && input.deadheadMiles > 0
          ? positiveNumber(input.deadheadMiles)
          : null,
      stop_revenue: null,
      stop_expense: null,
      notes: formatPickupNotes(input),
    },
  ];

  stopOffs.forEach((stop, index) => {
    rows.push({
      user_id: userId,
      stop_sequence: index + 2,
      stop_type: "stop_off",
      city: emptyToNull(stop.city),
      state: emptyToNull(stop.state),
      zip: emptyToNull(stop.zip),
      miles_from_previous:
        stop.milesFromPrevious > 0 ? stop.milesFromPrevious : null,
      stop_revenue: stop.stopRevenue > 0 ? stop.stopRevenue : null,
      stop_expense: stop.stopExpense > 0 ? stop.stopExpense : null,
      notes: emptyToNull(
        [
          `Stop Type: ${formatStopKind(stop.stopType)}`,
          stop.address ? `Address: ${stop.address}` : "",
          stop.notes,
        ]
          .filter(Boolean)
          .join(" | ")
      ),
    });
  });

  rows.push({
    user_id: userId,
    stop_sequence: rows.length + 1,
    stop_type: "delivery",
    city: emptyToNull(input.deliveryCity),
    state: emptyToNull(input.deliveryState),
    zip: emptyToNull(input.deliveryZip),
    miles_from_previous:
      stopOffs.length === 0 && input.loadedMiles > 0
        ? positiveNumber(input.loadedMiles)
        : null,
    stop_revenue: null,
    stop_expense: null,
    notes: emptyToNull(
      input.deliveryAddress ? `Address: ${input.deliveryAddress}` : ""
    ),
  });

  return rows;
}

export function routeStopCountForInput(input: LoadInput) {
  return buildSavedLoadStopRows(input, "00000000-0000-0000-0000-000000000000")
    .length;
}

export function formatRoutePoint(point: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}) {
  const cityState = [point.city, point.state].filter(Boolean).join(", ");
  return [point.address, cityState, point.zip].filter(Boolean).join(" ");
}

function hasDeadheadOrigin(input: LoadInput) {
  return Boolean(
    input.deadheadStartAddress ||
      input.deadheadStartCity ||
      input.deadheadStartState ||
      input.deadheadStartZip
  );
}

function formatPickupNotes(input: LoadInput) {
  const notes: string[] = [];

  if (input.pickupAddress) {
    notes.push(`Address: ${input.pickupAddress}`);
  }

  if (hasDeadheadOrigin(input)) {
    notes.push(
      `Deadhead origin: ${formatRoutePoint({
        address: input.deadheadStartAddress,
        city: input.deadheadStartCity,
        state: input.deadheadStartState,
        zip: input.deadheadStartZip,
      })}`
    );
  }

  return emptyToNull(notes.join(" | "));
}

function emptyToNull(value: string | undefined | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function positiveNumber(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
  return numericValue;
}

function normalizeDwellHours(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return DEFAULT_ROUTE_STOP_DWELL_HOURS;
  }

  return numericValue;
}

function formatStopKind(kind: string | undefined) {
  return kind === "delivery" ? "DEL" : "P/U";
}

function normalizeStopKind(kind: string | undefined): RouteStopInput["stopType"] {
  return kind === "delivery" ? "delivery" : "pickup";
}

function createRouteStopId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `stop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
