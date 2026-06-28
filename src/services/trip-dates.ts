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
