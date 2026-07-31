export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4
}

/** Overshoots past 1 before settling — the little bounce at the end of a travel. */
export function easeOutBack(t: number, overshoot = 1.7): number {
  return 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2
}
