import { describe, expect, it } from 'vitest'
import { nextCheckAt } from './playSession'

const MINUTE = 60_000

describe('nextCheckAt', () => {
  it('falls one interval after the start', () => {
    expect(nextCheckAt(0, 60 * MINUTE, 10 * MINUTE)).toBe(60 * MINUTE)
  })

  it('skips intervals already passed, so a reload does not repeat a reminder', () => {
    expect(nextCheckAt(0, 30 * MINUTE, 95 * MINUTE)).toBe(120 * MINUTE)
  })

  it('moves on to the next interval exactly on a boundary', () => {
    expect(nextCheckAt(0, 30 * MINUTE, 30 * MINUTE)).toBe(60 * MINUTE)
  })
})
