export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4
}

/** Eases in and out symmetrically — a fall that starts and ends gently. */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/** Overshoots past 1 before settling — the little bounce at the end of a travel. */
export function easeOutBack(t: number, overshoot = 1.7): number {
  return 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2
}
