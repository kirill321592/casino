import { easeOutBack, easeOutQuart } from '@/shared/lib/easing'
import type { RenderLoop } from '@/shared/lib/renderLoop'
import { pulseReel, setReelBlur, setReelPosition, type Reel, type SlotsScene } from './reelScene'

export const SLOTS_SPIN_DURATION_MS = 1500
export const SLOTS_CELEBRATION_MS = 900

const REEL_STAGGER_MS = 420
/* Extra time on the last reel when the first two already match. */
const ANTICIPATION_MS = 850
const SETTLE_MS = 260
const OVERSHOOT_ROWS = 0.38
const BASE_LOOPS = 4

interface ReelPlan {
  reel: Reel
  start: number
  target: number
  distance: number
  spinMs: number
  teasing: boolean
  travelled: number
}

export function animateReels(
  loop: RenderLoop,
  scene: SlotsScene,
  targetSymbols: string[],
  durationMs: number,
): Promise<void> {
  const lastIndex = scene.reels.length - 1
  // Two matching reels leave the last one deciding the payout, so drag it out.
  const teased =
    lastIndex > 0 &&
    targetSymbols.slice(0, lastIndex).every((symbol) => symbol === targetSymbols[0])

  const plans: ReelPlan[] = scene.reels.map((reel, i) => {
    // Every drum carries its own symbol order, so each target is looked up on it.
    const cells = reel.strip.length
    const target = Math.max(0, reel.strip.indexOf(targetSymbols[i] ?? reel.strip[0]!))
    const start = reel.position % cells
    const forward = (((target - start) % cells) + cells) % cells
    const teasing = teased && i === lastIndex

    return {
      reel,
      start,
      target,
      // Later reels loop once more and run longer, so they stop one by one.
      distance: forward + (BASE_LOOPS + i) * cells,
      spinMs: durationMs + i * REEL_STAGGER_MS + (teasing ? ANTICIPATION_MS : 0),
      teasing,
      travelled: 0,
    }
  })

  const startTime = performance.now()

  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - startTime
      let allDone = true

      for (const plan of plans) {
        const settled = elapsed >= plan.spinMs + SETTLE_MS
        const travel = settled ? plan.distance : travelAt(plan, elapsed)

        setReelPosition(plan.reel, (plan.start + travel) % plan.reel.strip.length)
        setReelBlur(plan.reel, Math.abs(travel - plan.travelled))
        plan.reel.glow.opacity = isAnticipating(plan, elapsed, settled)
          ? anticipationGlow(elapsed)
          : 0
        plan.travelled = travel

        if (!settled) allDone = false
      }

      if (allDone) {
        for (const plan of plans) {
          setReelPosition(plan.reel, plan.target)
          setReelBlur(plan.reel, 0)
          plan.reel.glow.opacity = 0
        }
        loop.remove(tick)
        resolve()
      }
    }

    loop.add(tick)
  })
}

/** Runs past the target, then springs back onto it — a reel dropping into its notch. */
function travelAt(plan: ReelPlan, elapsed: number): number {
  if (elapsed < plan.spinMs) {
    return (plan.distance + OVERSHOOT_ROWS) * easeOutQuart(elapsed / plan.spinMs)
  }
  return plan.distance + OVERSHOOT_ROWS * (1 - easeOutBack((elapsed - plan.spinMs) / SETTLE_MS))
}

/* Only from the moment the reel would normally have stopped — that is the tense part. */
function isAnticipating(plan: ReelPlan, elapsed: number, settled: boolean): boolean {
  return plan.teasing && !settled && elapsed > plan.spinMs - ANTICIPATION_MS
}

function anticipationGlow(elapsed: number): number {
  return 0.3 + 0.45 * Math.sin(elapsed / 90) ** 2
}

/** Flashes the symbols that paid. Cosmetic only — the balance is already settled. */
export function celebrateWin(
  loop: RenderLoop,
  scene: SlotsScene,
  reelIndexes: number[],
): Promise<void> {
  const winners = reelIndexes.flatMap((index) => scene.reels[index] ?? [])
  if (winners.length === 0) return Promise.resolve()

  const startTime = performance.now()

  return new Promise((resolve) => {
    const tick = () => {
      const t = Math.min((performance.now() - startTime) / SLOTS_CELEBRATION_MS, 1)
      const pulse = t < 1 ? Math.sin(t * Math.PI * 3) ** 2 : 0

      for (const reel of winners) pulseReel(reel, pulse)

      if (t >= 1) {
        for (const reel of winners) pulseReel(reel, 0)
        loop.remove(tick)
        resolve()
      }
    }

    loop.add(tick)
  })
}
