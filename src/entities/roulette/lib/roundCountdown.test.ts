import { describe, expect, it } from 'vitest'
import { countdownProgress, formatCountdown, remainingMs } from './roundCountdown'

describe('remainingMs', () => {
  it('counts down as time passes since the state arrived', () => {
    expect(remainingMs(15_000, 0)).toBe(15_000)
    expect(remainingMs(15_000, 8_000)).toBe(7_000)
  })

  it('floors at zero once betting has closed', () => {
    expect(remainingMs(15_000, 15_000)).toBe(0)
  })

  /* A tab left in the background can resume long past the deadline. */
  it('never reports a negative wait', () => {
    expect(remainingMs(15_000, 600_000)).toBe(0)
  })

  // The server re-reads closesIn on every send, so a state arriving mid-round
  // carries what is genuinely left rather than the full window.
  it('starts from whatever the server had left, not the full window', () => {
    expect(remainingMs(4_000, 1_000)).toBe(3_000)
  })

  it('is unaffected by the size of the elapsed reading', () => {
    // Both arguments come off the same monotonic clock, so no wall-clock jump
    // can push this backwards.
    expect(remainingMs(15_000, 0)).toBeGreaterThan(remainingMs(15_000, 1))
  })
})

describe('formatCountdown', () => {
  it.each([
    [7_000, '7s'],
    [7_400, '8s'],
    [59_000, '59s'],
    [0, '0s'],
  ])('renders %ims as %s', (ms, expected) => {
    expect(formatCountdown(ms)).toBe(expected)
  })

  it('rounds up so the final second is not shown as zero', () => {
    expect(formatCountdown(200)).toBe('1s')
  })

  it.each([
    [60_000, '1:00'],
    [65_000, '1:05'],
    [125_000, '2:05'],
  ])('switches to m:ss at %ims', (ms, expected) => {
    expect(formatCountdown(ms)).toBe(expected)
  })

  it('pads the seconds so the width does not jump', () => {
    expect(formatCountdown(61_000)).toBe('1:01')
  })
})

describe('countdownProgress', () => {
  it('is full at the start of the window', () => {
    expect(countdownProgress(15_000, 15_000)).toBe(1)
  })

  it('is half way through', () => {
    expect(countdownProgress(7_500, 15_000)).toBe(0.5)
  })

  it('is empty at the close', () => {
    expect(countdownProgress(0, 15_000)).toBe(0)
  })

  it.each([
    [-100, 15_000],
    [20_000, 15_000],
  ])('clamps %i against a %i window', (remaining, window) => {
    const progress = countdownProgress(remaining, window)
    expect(progress).toBeGreaterThanOrEqual(0)
    expect(progress).toBeLessThanOrEqual(1)
  })

  // Nothing to divide by if the server ever reported a zero-length window.
  it('does not divide by an unknown window', () => {
    expect(countdownProgress(5_000, 0)).toBe(0)
  })

  /* An older server sends no durationMs; scaleX(NaN) would reach the DOM. */
  it.each([Number.NaN, undefined as unknown as number, -1])(
    'returns a usable number for a %p window',
    (windowMs) => {
      expect(countdownProgress(5_000, windowMs)).toBe(0)
    },
  )
})
