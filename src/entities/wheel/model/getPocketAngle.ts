import { getPocketIndex, SEGMENT_ANGLE } from './wheelLayout'

/** Angle (radians) of a pocket's center, 0 = top (12 o'clock). */
export function getPocketCenterAngle(pocketNumber: number): number {
  const index = getPocketIndex(pocketNumber)
  return index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
}

/** Wheel rotation needed so `pocketNumber` sits at the top marker. */
export function getWheelRotationForPocket(pocketNumber: number): number {
  const pocketAngle = getPocketCenterAngle(pocketNumber)
  return -pocketAngle - Math.PI / 2
}

export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2
  return ((angle % twoPi) + twoPi) % twoPi
}
