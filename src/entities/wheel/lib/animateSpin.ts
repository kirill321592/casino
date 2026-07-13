import type { Ticker } from 'pixi.js'
import { easeOutCubic } from '@/shared/lib/easing'
import { WHEEL_FULL_ROTATIONS } from '@/shared/config/wheelConstants'
import { getWheelRotationForPocket } from '../model/getPocketAngle'
import type { WheelScene } from './createWheel'

export function animateSpin(
  ticker: Ticker,
  scene: WheelScene,
  pocketNumber: number,
  durationMs: number,
): Promise<void> {
  const startWheel = scene.wheel.rotation
  const targetWheel = getWheelRotationForPocket(pocketNumber)
  const fullSpins = WHEEL_FULL_ROTATIONS * Math.PI * 2

  let delta = targetWheel - startWheel
  while (delta < fullSpins) {
    delta += Math.PI * 2
  }
  const endWheel = startWheel + delta

  const startBall = scene.ballArm.rotation
  const endBall = 0
  const ballSpins = -6 * Math.PI * 2
  const endBallWithSpins = startBall + ballSpins

  const startTime = performance.now()

  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - startTime
      const rawT = Math.min(elapsed / durationMs, 1)
      const t = easeOutCubic(rawT)

      scene.wheel.rotation = startWheel + (endWheel - startWheel) * t
      scene.ballArm.rotation = startBall + (endBallWithSpins - startBall) * t

      if (rawT >= 1) {
        scene.wheel.rotation = endWheel
        scene.ballArm.rotation = endBall
        ticker.remove(tick)
        resolve()
      }
    }

    ticker.add(tick)
  })
}
