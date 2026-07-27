import { getPocketIndex, SEGMENT_ANGLE } from './wheelLayout'

/** Angle (radians) of a pocket's center, 0 = top (12 o'clock). */
export function getPocketCenterAngle(pocketNumber: number): number {
  const index = getPocketIndex(pocketNumber)
  return index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
}

/**
 * Wheel rotation needed so `pocketNumber` sits at the top marker.
 *
 * `getPocketCenterAngle` is measured from 12 o'clock and `drawPockets` already
 * bakes the same -PI/2 into where it draws each pocket, so undoing the pocket's
 * own angle is enough. Subtracting -PI/2 again over-rotates by a quarter turn.
 */
export function getWheelRotationForPocket(pocketNumber: number): number {
  return -getPocketCenterAngle(pocketNumber)
}
