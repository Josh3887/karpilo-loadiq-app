export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function roundTo(value: number, fractionDigits = 2) {
  if (!Number.isFinite(value)) return 0;

  return Number(value.toFixed(fractionDigits));
}

export function roundFuelPrice(value: number) {
  return roundTo(value, 2);
}

export function formatFuelPrice(value: number) {
  return `${formatCurrency(roundFuelPrice(value))}/gal`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function formatRpm(value: number) {
  return `$${value.toFixed(2)}/mi`;
}
