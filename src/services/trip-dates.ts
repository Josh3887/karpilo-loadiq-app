export type TripDatePreset =
  | {
      days: number;
      error: null;
    }
  | {
      days: null;
      error: string | null;
    };

export function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toDateInputValue(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : formatLocalDate(value);
  }

  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (dateOnly && isValidDateParts(dateOnly[1], dateOnly[2], dateOnly[3])) {
    return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";

  return formatLocalDate(parsed);
}

export function toTimeInputValue(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : formatLocalTime(value);
  }

  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const timeOnly = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (timeOnly) {
    return formatTimeParts(timeOnly[1], timeOnly[2]);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "";
  }

  if (!/^\d{4}-\d{2}-\d{2}[T\s]\d{1,2}:\d{2}/.test(trimmed)) {
    return "";
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";

  return formatLocalTime(parsed);
}

export function combineDateAndTimeForSnapshot(
  date: string,
  time?: string
): string | null {
  const normalizedDate = toDateInputValue(date);
  if (!normalizedDate) return null;

  const normalizedTime = toTimeInputValue(time);
  return normalizedTime
    ? `${normalizedDate}T${normalizedTime}:00`
    : normalizedDate;
}

export function snapToQuarterDay(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Number((Math.round(value * 4) / 4).toFixed(2));
}

export function roundHoursToQuarter(hours: number): number {
  if (!Number.isFinite(hours)) return 0;

  return Number((Math.round(hours * 4) / 4).toFixed(2));
}

export function minutesToHumanDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "Unavailable";

  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function minutesToQuarterHours(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes < 0) return 0;

  return roundHoursToQuarter(minutes / 60);
}

export function milesToBenchmarkHours(miles: number, mph = 50): number {
  if (!Number.isFinite(miles) || !Number.isFinite(mph) || miles <= 0 || mph <= 0) {
    return 0;
  }

  return roundHoursToQuarter(miles / mph);
}

export function hoursToPlanningDays(hours: number, hoursPerDay = 10): number {
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(hoursPerDay) ||
    hours <= 0 ||
    hoursPerDay <= 0
  ) {
    return 0;
  }

  return roundHoursToQuarter(hours / hoursPerDay);
}

export function calculateInclusiveTripDays(
  startDate: string | undefined,
  endDate: string | undefined,
  endBeforeStartMessage: string
): TripDatePreset {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!start || !end) {
    return {
      days: null,
      error: null,
    };
  }

  if (end.utcTime < start.utcTime) {
    return {
      days: null,
      error: endBeforeStartMessage,
    };
  }

  const days =
    Math.floor((end.utcTime - start.utcTime) / 86_400_000) + 1;

  return {
    days: snapToQuarterDay(Math.max(days, 1)),
    error: null,
  };
}

export function isEndDateBeforeStartDate(
  startDate: string | undefined,
  endDate: string | undefined
) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  return Boolean(start && end && end.utcTime < start.utcTime);
}

function parseDateOnly(value: string | undefined) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcTime = Date.UTC(year, month - 1, day);

  if (!Number.isFinite(utcTime)) return null;

  return {
    year,
    month,
    day,
    utcTime,
  };
}

function formatLocalTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatTimeParts(hoursValue: string, minutesValue: string) {
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "";
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function isValidDateParts(
  yearValue: string,
  monthValue: string,
  dayValue: string
) {
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(year, month - 1, day);

  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
