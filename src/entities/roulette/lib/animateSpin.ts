import { easeInOutSine, easeOutCubic, easeOutQuart } from '@/shared/lib/easing'
import type { RenderLoop } from '@/shared/lib/renderLoop'
import { getPocketCenterAngle, getWheelRotationForPocket } from '../model/getPocketAngle'
import {
  POCKET_REST_RADIUS,
  POCKET_REST_Y,
  setBallPosition,
  TRACK_REST_Y,
  type WheelScene,
} from './wheelScene'

export const SPIN_DURATION_MS = 5200

const WHEEL_FULL_ROTATIONS = 4
/* Orbits the ball makes relative to the wheel before it settles. */
const BALL_REVOLUTIONS = 9

/* Fractions of the spin: riding the track, falling, then settling in the pocket. */
const DROP_START = 0.58
const DROP_END = 0.87

const BOUNCE_HEIGHT = 0.055
const BOUNCE_COUNT = 3
/* How far the ball wanders off a clean spiral on its way down the cone. */
const SCATTER_RADIUS = 0.045

/**
 * Flies the ball onto `pocketNumber`.
 *
 * The outcome is decided by the server before this runs, so nothing here is
 * simulated — the ball's angle is defined as the winning pocket's world angle
 * plus a decaying offset, which makes it counter-rotate against the wheel early
 * on and arrive exactly in the pocket no matter where it started. The physical
 * look comes from the radius and height curves, not from the landing.
 */
export function animateSpin(
  loop: RenderLoop,
  scene: WheelScene,
  pocketNumber: number,
  durationMs: number,
): Promise<void> {
  const startWheel = scene.wheel.rotation.y
  const pocketLocalAngle = getPocketCenterAngle(pocketNumber)

  /*
   * Where the wheel happens to coast to a stop. Without it the winning pocket
   * is always driven to the same place and the ball freezes on the same pixel
   * every round, which is the tell that nothing is being simulated. The ball's
   * angle is measured against the wheel, so it follows this into the right
   * pocket on its own.
   */
  const restOffset = Math.random() * Math.PI * 2
  const targetWheel = getWheelRotationForPocket(pocketNumber) + restOffset

  const fullSpins = WHEEL_FULL_ROTATIONS * Math.PI * 2
  let delta = targetWheel - startWheel
  while (delta < fullSpins) delta += Math.PI * 2
  const endWheel = startWheel + delta

  /* A shortened spin gets proportionally fewer orbits, or it reads as a blur. */
  const revolutions = BALL_REVOLUTIONS * Math.min(1, durationMs / SPIN_DURATION_MS)
  const startTime = performance.now()

  return new Promise((resolve) => {
    const tick = () => {
      const rawT = Math.min((performance.now() - startTime) / durationMs, 1)

      const wheelRotation = startWheel + (endWheel - startWheel) * easeOutCubic(rawT)
      scene.wheel.rotation.y = wheelRotation

      const remainingOrbits = revolutions * Math.PI * 2 * (1 - easeOutQuart(rawT))
      const ballAngle = wheelRotation + pocketLocalAngle + remainingOrbits

      setBallPosition(
        scene.ball,
        ballAngle,
        ballRadius(rawT, scene.trackRadius, ballAngle),
        ballHeight(rawT),
      )

      if (rawT >= 1) {
        scene.wheel.rotation.y = endWheel
        setBallPosition(scene.ball, endWheel + pocketLocalAngle, POCKET_REST_RADIUS, POCKET_REST_Y)
        loop.remove(tick)
        resolve()
      }
    }

    loop.add(tick)
  })
}

/** Holds the banked track, then spirals inward once the ball loses its grip. */
function ballRadius(t: number, trackRadius: number, angle: number): number {
  if (t <= DROP_START) return trackRadius

  const fall = Math.min((t - DROP_START) / (DROP_END - DROP_START), 1)
  const spiral = trackRadius + (POCKET_REST_RADIUS - trackRadius) * easeInOutSine(fall)

  /* Keeps the descent from looking machined: strongest mid-fall, gone by the
   * time the pocket takes it. */
  const scatter = Math.sin(fall * Math.PI) * Math.sin(angle * 4) * SCATTER_RADIUS
  return spiral + scatter
}

/** Rides the rim, then drops with a couple of decaying bounces. */
function ballHeight(t: number): number {
  if (t <= DROP_START) return TRACK_REST_Y

  const fall = Math.min((t - DROP_START) / (DROP_END - DROP_START), 1)
  const settled = TRACK_REST_Y + (POCKET_REST_Y - TRACK_REST_Y) * easeInOutSine(fall)
  const bounce = Math.abs(Math.sin(fall * Math.PI * BOUNCE_COUNT)) * BOUNCE_HEIGHT * (1 - fall) ** 2

  return settled + bounce
}
