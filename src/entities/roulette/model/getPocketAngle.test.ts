import { describe, expect, it } from 'vitest'
import { getPocketCenterAngle, getWheelRotationForPocket } from './getPocketAngle'
import { POCKET_COUNT, SEGMENT_ANGLE, WHEEL_ORDER } from './wheelLayout'

const FULL_TURN = Math.PI * 2
/** The marker the winning pocket has to come to rest under: 12 o'clock. */
const TOP_MARKER = 0
const PRECISION = 10

function normalize(angle: number): number {
  return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN
}

/** Where a pocket ends up once the wheel has been rotated by `rotation`. */
function restingAngle(pocketNumber: number, rotation: number): number {
  return normalize(getPocketCenterAngle(pocketNumber) + rotation)
}

describe('getPocketCenterAngle', () => {
  it('puts the first pocket half a segment past the top', () => {
    expect(getPocketCenterAngle(WHEEL_ORDER[0])).toBeCloseTo(SEGMENT_ANGLE / 2, PRECISION)
  })

  it('spaces neighbouring pockets one segment apart', () => {
    for (let i = 1; i < POCKET_COUNT; i++) {
      const step = getPocketCenterAngle(WHEEL_ORDER[i]) - getPocketCenterAngle(WHEEL_ORDER[i - 1])
      expect(step).toBeCloseTo(SEGMENT_ANGLE, PRECISION)
    }
  })

  it('keeps every pocket inside one turn', () => {
    for (const number of WHEEL_ORDER) {
      const angle = getPocketCenterAngle(number)
      expect(angle).toBeGreaterThan(0)
      expect(angle).toBeLessThan(FULL_TURN)
    }
  })

  it('gives no two pockets the same centre', () => {
    const angles = new Set(WHEEL_ORDER.map(getPocketCenterAngle))

    expect(angles.size).toBe(POCKET_COUNT)
  })
})

describe('getWheelRotationForPocket', () => {
  /*
   * The one that matters: the ball has to stop on the number the server rolled.
   * `drawPockets` already bakes the -PI/2 that puts pocket 0 at the top, so
   * subtracting it again here parks the wheel a quarter turn off and the player
   * is shown a different number than they were paid for.
   */
  it('brings every pocket to rest under the top marker', () => {
    for (const number of WHEEL_ORDER) {
      const resting = restingAngle(number, getWheelRotationForPocket(number))
      expect(normalize(resting)).toBeCloseTo(TOP_MARKER, PRECISION)
    }
  })

  it('does not leave the wheel a quarter turn out', () => {
    // Spelled out separately because a uniform quarter-turn error is exactly the
    // kind of mistake a "looks about right" screenshot review lets through.
    const resting = restingAngle(17, getWheelRotationForPocket(17))

    expect(resting).not.toBeCloseTo(Math.PI / 2, 3)
    expect(resting).not.toBeCloseTo(-Math.PI / 2 + FULL_TURN, 3)
  })

  it('turns the wheel backwards by less than one full turn', () => {
    for (const number of WHEEL_ORDER) {
      const rotation = getWheelRotationForPocket(number)
      expect(rotation).toBeLessThanOrEqual(0)
      expect(rotation).toBeGreaterThan(-FULL_TURN)
    }
  })

  it('gives every pocket its own resting rotation', () => {
    const rotations = new Set(WHEEL_ORDER.map(getWheelRotationForPocket))

    expect(rotations.size).toBe(POCKET_COUNT)
  })

  it('shifts by exactly one segment between neighbouring pockets', () => {
    for (let i = 1; i < POCKET_COUNT; i++) {
      const step =
        getWheelRotationForPocket(WHEEL_ORDER[i - 1]) - getWheelRotationForPocket(WHEEL_ORDER[i])
      expect(step).toBeCloseTo(SEGMENT_ANGLE, PRECISION)
    }
  })

  it('refuses a number the wheel does not have', () => {
    expect(() => getWheelRotationForPocket(37)).toThrow(/Invalid pocket number/)
  })
})
