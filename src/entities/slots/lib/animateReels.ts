import type { Ticker } from 'pixi.js'
import { easeOutCubic } from '@/shared/lib/easing'
import { CELL_HEIGHT, STRIP, type SlotsScene } from './createReels'

export const SLOTS_SPIN_DURATION_MS = 1400
const REEL_STAGGER_MS = 350
const BASE_LOOPS = 3

export function animateReels(
  ticker: Ticker,
  scene: SlotsScene,
  targetSymbols: string[],
  durationMs: number,
): Promise<void> {
  const plans = scene.reels.map((reel, i) => {
    const target = Math.max(0, STRIP.indexOf(targetSymbols[i] ?? STRIP[0]!))
    const start = reel.position % STRIP.length
    const forward = (((target - start) % STRIP.length) + STRIP.length) % STRIP.length
    return {
      reel,
      start,
      target,
      // Later reels loop once more and run longer, so they stop one by one.
      distance: forward + (BASE_LOOPS + i) * STRIP.length,
      duration: durationMs + i * REEL_STAGGER_MS,
    }
  })

  const startTime = performance.now()

  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - startTime
      let allDone = true

      for (const plan of plans) {
        const rawT = Math.min(elapsed / plan.duration, 1)
        const position = (plan.start + plan.distance * easeOutCubic(rawT)) % STRIP.length
        plan.reel.position = position
        plan.reel.strip.y = -position * CELL_HEIGHT
        if (rawT < 1) allDone = false
      }

      if (allDone) {
        for (const plan of plans) {
          plan.reel.position = plan.target
          plan.reel.strip.y = -plan.target * CELL_HEIGHT
        }
        ticker.remove(tick)
        resolve()
      }
    }

    ticker.add(tick)
  })
}
