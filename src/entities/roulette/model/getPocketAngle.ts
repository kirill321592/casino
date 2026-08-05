import { getPocketIndex, SEGMENT_ANGLE } from './wheelLayout'

/** Angle (radians) of a pocket's center, measured from the side facing the camera. */
export function getPocketCenterAngle(pocketNumber: number): number {
  const index = getPocketIndex(pocketNumber)
  return index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
}

/**
 * Wheel rotation that brings `pocketNumber` round to angle 0.
 *
 * The scene bakes the same origin into where it places each pocket, so undoing
 * the pocket's own angle is enough — no extra quarter turn.
 *
 * This is the base rotation, not where the wheel actually stops: `animateSpin`
 * adds a random resting offset on top, since a real wheel coasts to an
 * arbitrary halt rather than presenting the winner at a fixed point.
 */
export function getWheelRotationForPocket(pocketNumber: number): number {
  return -getPocketCenterAngle(pocketNumber)
}
