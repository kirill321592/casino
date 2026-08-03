import { describe, expect, it } from 'vitest'
import {
  getPocketColor,
  getPocketIndex,
  POCKET_COUNT,
  RED_NUMBERS,
  SEGMENT_ANGLE,
  WHEEL_ORDER,
} from './wheelLayout'

const ALL_NUMBERS = Array.from({ length: 37 }, (_, n) => n)

/**
 * The European wheel's colouring rule, independent of the set above: in 1–10 and
 * 19–28 the odd numbers are red; in 11–18 and 29–36 the even ones are. Checking
 * against the rule rather than a second copy of the list is what makes this able
 * to catch a typo in `RED_NUMBERS`.
 */
function shouldBeRed(n: number): boolean {
  const oddIsRed = (n >= 1 && n <= 10) || (n >= 19 && n <= 28)
  return n % 2 === (oddIsRed ? 1 : 0)
}

describe('WHEEL_ORDER', () => {
  it('has one pocket per number on a European wheel', () => {
    expect(POCKET_COUNT).toBe(37)
    expect(WHEEL_ORDER).toHaveLength(37)
  })

  it('holds every number from 0 to 36 exactly once', () => {
    expect([...WHEEL_ORDER].sort((a, b) => a - b)).toEqual(ALL_NUMBERS)
  })

  it('starts at zero', () => {
    expect(WHEEL_ORDER[0]).toBe(0)
  })

  /* Real wheels alternate colours around the rim apart from either side of 0. */
  it('never puts two pockets of the same colour side by side', () => {
    const clashes = WHEEL_ORDER.filter((number, i) => {
      const next = WHEEL_ORDER[(i + 1) % POCKET_COUNT]
      return number !== 0 && next !== 0 && getPocketColor(number) === getPocketColor(next)
    })

    expect(clashes).toEqual([])
  })
})

describe('RED_NUMBERS', () => {
  it('holds eighteen numbers', () => {
    expect(RED_NUMBERS.size).toBe(18)
  })

  it('does not claim zero', () => {
    expect(RED_NUMBERS.has(0)).toBe(false)
  })

  it('matches the European colouring rule', () => {
    const wrong = ALL_NUMBERS.filter((n) => n !== 0 && RED_NUMBERS.has(n) !== shouldBeRed(n))

    expect(wrong).toEqual([])
  })
})

describe('getPocketColor', () => {
  it('paints zero green', () => {
    expect(getPocketColor(0)).toBe('green')
  })

  it('splits the rest evenly between red and black', () => {
    const counts = ALL_NUMBERS.map(getPocketColor)

    expect(counts.filter((c) => c === 'red')).toHaveLength(18)
    expect(counts.filter((c) => c === 'black')).toHaveLength(18)
    expect(counts.filter((c) => c === 'green')).toHaveLength(1)
  })

  it.each([1, 19, 36])('paints %i red', (n) => {
    expect(getPocketColor(n)).toBe('red')
  })

  it.each([2, 20, 35])('paints %i black', (n) => {
    expect(getPocketColor(n)).toBe('black')
  })
})

describe('getPocketIndex', () => {
  it('finds every pocket', () => {
    for (const number of ALL_NUMBERS) {
      expect(WHEEL_ORDER[getPocketIndex(number)]).toBe(number)
    }
  })

  // A number the wheel does not have means the server and the client disagree,
  // and silently landing on pocket -1 would be worse than the throw.
  it.each([37, -1, 0.5, Number.NaN])('refuses %p', (number) => {
    expect(() => getPocketIndex(number)).toThrow(/Invalid pocket number/)
  })
})

describe('SEGMENT_ANGLE', () => {
  it('divides the full turn among the pockets', () => {
    expect(SEGMENT_ANGLE * POCKET_COUNT).toBeCloseTo(Math.PI * 2, 10)
  })
})
