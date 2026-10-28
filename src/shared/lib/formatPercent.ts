const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

/** A fraction as a percentage: 0.96 → "96.0%", 36/37 → "97.3%". */
export function formatPercent(fraction: number): string {
  return percent.format(fraction)
}
