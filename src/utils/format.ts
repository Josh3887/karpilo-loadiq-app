export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
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
