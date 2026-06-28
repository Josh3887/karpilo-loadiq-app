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
