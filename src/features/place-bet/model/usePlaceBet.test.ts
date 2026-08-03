import { describe, expect, it } from 'vitest'
import type { RouletteStore } from '@/entities/roulette/model/rouletteStore'
import { createInitialRouletteState } from '@/entities/roulette/model/rouletteReducer'
import type { RoundState } from '@/shared/api/roulette'
import { canPlaceBets } from './usePlaceBet'

const round = (status: RoundState['status'] = 'betting'): RoundState => ({
  id: 'r1',
  status,
  closesAt: '2026-08-03T12:00:00.000Z',
  closesIn: 15_000,
  durationMs: 15_000,
  betsCount: 0,
})

/** Only the fields the selector reads matter; the rest are along for the type. */
function store(overrides: Partial<RouletteStore>): RouletteStore {
  return {
    ...createInitialRouletteState(100),
    connected: true,
    error: null,
    round: round(),
    dispatch: () => {},
    placeBet: () => {},
    connect: () => () => {},
    ...overrides,
  }
}

describe('canPlaceBets', () => {
  it('takes bets on an open round', () => {
    expect(canPlaceBets(store({ phase: 'idle' }))).toBe(true)
  })

  /*
   * The server opens the next round about half a second before the wheel stops,
   * so the result is still on screen while betting is genuinely open. Requiring
   * an idle phase here made the player dismiss the overlay first and quietly cost
   * them seconds off a window they never saw start.
   */
  it('keeps taking bets while the previous result is still on screen', () => {
    expect(canPlaceBets(store({ phase: 'result' }))).toBe(true)
  })

  it('refuses while the wheel is turning', () => {
    expect(canPlaceBets(store({ phase: 'spinning' }))).toBe(false)
  })

  it('refuses once the round has closed for betting', () => {
    expect(canPlaceBets(store({ phase: 'idle', round: round('spinning') }))).toBe(false)
  })

  it('refuses before any round is known', () => {
    expect(canPlaceBets(store({ phase: 'idle', round: null }))).toBe(false)
  })

  // Without a socket the bet has nowhere to go, whatever the table looks like.
  it('refuses while disconnected', () => {
    expect(canPlaceBets(store({ phase: 'idle', connected: false }))).toBe(false)
  })
})
