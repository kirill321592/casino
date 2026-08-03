import { describe, expect, it } from 'vitest'
import { DEFAULT_CHIP, HISTORY_LENGTH } from '@/shared/config/constants'
import type { RoundState } from '@/shared/api/roulette'
import {
  createInitialRouletteState,
  rouletteReducer,
  type RouletteAction,
  type RouletteState,
} from './rouletteReducer'

const OPENING_BALANCE = 100
const STAKE = 5
/** 7 is red, so a 5 chip on red pays 10 and leaves 105 behind. */
const WINNING_NUMBER = 7
const PAYOUT = 10
const SETTLED_BALANCE = 105

function reduce(state: RouletteState, ...actions: RouletteAction[]): RouletteState {
  return actions.reduce<RouletteState>(rouletteReducer, state)
}

function round(id: string, status: RoundState['status'] = 'betting'): RoundState {
  return {
    id,
    status,
    closesAt: '2026-08-03T12:00:00.000Z',
    closesIn: 15_000,
    durationMs: 15_000,
    betsCount: 0,
  }
}

/** Table open on round 1, one chip on red, stake already taken by the server. */
function betting(): RouletteState {
  return reduce(
    createInitialRouletteState(OPENING_BALANCE),
    { type: 'ROUND_STATE', round: round('r1') },
    {
      type: 'BET_ACCEPTED',
      bet: { type: 'red', amount: STAKE },
      balance: OPENING_BALANCE - STAKE,
      roundId: 'r1',
    },
  )
}

/** The result is in and the wheel is turning on it. */
function spinning(): RouletteState {
  return reduce(betting(), {
    type: 'ROUND_RESULT',
    winningNumber: WINNING_NUMBER,
    payout: PAYOUT,
    balance: SETTLED_BALANCE,
  })
}

/** One full round that lands on `winningNumber` and pays nothing. */
function spinOnce(state: RouletteState, winningNumber: number): RouletteState {
  return reduce(
    state,
    { type: 'ROUND_RESULT', winningNumber, payout: 0, balance: state.balance },
    { type: 'SPIN_COMPLETE' },
  )
}

describe('createInitialRouletteState', () => {
  it('opens on the given balance with the default chip and nothing staked', () => {
    const state = createInitialRouletteState(OPENING_BALANCE)

    expect(state).toMatchObject({
      phase: 'idle',
      balance: OPENING_BALANCE,
      bets: [],
      selectedChip: DEFAULT_CHIP,
      lastResult: null,
      history: [],
      pendingResult: null,
      round: null,
    })
  })
})

describe('SET_CHIP', () => {
  it('changes the chip between rounds', () => {
    const state = reduce(betting(), { type: 'SET_CHIP', chip: 25 })

    expect(state.selectedChip).toBe(25)
  })

  it('is refused while the wheel is turning', () => {
    const state = reduce(spinning(), { type: 'SET_CHIP', chip: 25 })

    expect(state.selectedChip).toBe(DEFAULT_CHIP)
  })
})

describe('BET_ACCEPTED', () => {
  it('adds the bet and adopts the balance the server reported', () => {
    const state = betting()

    expect(state.bets).toHaveLength(1)
    expect(state.bets[0]).toMatchObject({ type: 'red', amount: STAKE })
    expect(state.balance).toBe(OPENING_BALANCE - STAKE)
  })

  it('gives every bet its own id so the board can key and remove them', () => {
    const state = reduce(betting(), {
      type: 'BET_ACCEPTED',
      bet: { type: 'straight', amount: STAKE, value: 17 },
      balance: OPENING_BALANCE - 2 * STAKE,
      roundId: 'r1',
    })

    const [first, second] = state.bets
    expect(first.id).toMatch(/^bet-\d+$/)
    expect(second.id).toMatch(/^bet-\d+$/)
    expect(first.id).not.toBe(second.id)
  })

  it('keeps a straight bet’s number', () => {
    const state = reduce(betting(), {
      type: 'BET_ACCEPTED',
      bet: { type: 'straight', amount: STAKE, value: 17 },
      balance: OPENING_BALANCE - 2 * STAKE,
      roundId: 'r1',
    })

    expect(state.bets[1].value).toBe(17)
  })

  /* Mid-spin the balance is held back for the reveal. */
  it('is refused while the wheel is turning', () => {
    const before = spinning()
    const after = reduce(before, {
      type: 'BET_ACCEPTED',
      bet: { type: 'black', amount: STAKE },
      balance: 1,
      roundId: 'r1',
    })

    expect(after).toBe(before)
  })

  /*
   * The round named on the acceptance is what decides, not the phase: a slow
   * answer for a settled round must not land, however the table looks now.
   */
  it('is refused when it names a round that is no longer open', () => {
    const before = reduce(
      spinning(),
      { type: 'SPIN_COMPLETE' },
      { type: 'ROUND_STATE', round: round('r2') },
    )
    const after = reduce(before, {
      type: 'BET_ACCEPTED',
      bet: { type: 'red', amount: STAKE },
      balance: OPENING_BALANCE - STAKE,
      roundId: 'r1',
    })

    expect(after).toBe(before)
  })

  it('puts no chip on the board for a round that already paid out', () => {
    const state = reduce(
      spinning(),
      { type: 'SPIN_COMPLETE' },
      { type: 'ROUND_STATE', round: round('r2') },
      {
        type: 'BET_ACCEPTED',
        bet: { type: 'red', amount: STAKE },
        balance: OPENING_BALANCE - STAKE,
        roundId: 'r1',
      },
    )

    expect(state.bets).toEqual([])
  })

  /*
   * The balance on a late acceptance was read before the round paid out, so it is
   * older than the one SPIN_COMPLETE just settled on. Taking it would delete the
   * player's winnings from the screen until the next round restated them.
   */
  it('does not roll a settled balance back to a pre-result figure', () => {
    const settled = reduce(
      spinning(),
      { type: 'SPIN_COMPLETE' },
      { type: 'ROUND_STATE', round: round('r2') },
    )
    expect(settled.balance).toBe(SETTLED_BALANCE)

    const state = reduce(settled, {
      type: 'BET_ACCEPTED',
      bet: { type: 'red', amount: STAKE },
      balance: OPENING_BALANCE - STAKE,
      roundId: 'r1',
    })

    expect(state.balance).toBe(SETTLED_BALANCE)
    expect(state.lastWinnings).toBe(PAYOUT)
  })

  /*
   * The server opens the next round before the wheel stops, so this acceptance is
   * for a round that is genuinely open while the previous result is still up.
   * Refusing it would drop a stake the player has already been charged for.
   */
  it('takes a bet on the open round while the result is still on screen', () => {
    const state = reduce(
      spinning(),
      { type: 'ROUND_STATE', round: round('r2') },
      { type: 'SPIN_COMPLETE' },
      {
        type: 'BET_ACCEPTED',
        bet: { type: 'black', amount: STAKE },
        balance: SETTLED_BALANCE - STAKE,
        roundId: 'r2',
      },
    )

    expect(state.phase).toBe('result')
    expect(state.bets).toHaveLength(1)
    expect(state.balance).toBe(SETTLED_BALANCE - STAKE)
  })

  it('is refused before any round is known', () => {
    const before = createInitialRouletteState(OPENING_BALANCE)
    const after = reduce(before, {
      type: 'BET_ACCEPTED',
      bet: { type: 'red', amount: STAKE },
      balance: 1,
      roundId: 'r1',
    })

    expect(after).toBe(before)
  })
})

describe('BALANCE_SYNC', () => {
  it('takes the server figure between rounds', () => {
    const state = reduce(betting(), { type: 'BALANCE_SYNC', balance: 250 })

    expect(state.balance).toBe(250)
  })

  it('is ignored mid-spin so a reconnect cannot reveal the payout early', () => {
    const state = reduce(spinning(), { type: 'BALANCE_SYNC', balance: SETTLED_BALANCE })

    expect(state.balance).toBe(OPENING_BALANCE - STAKE)
  })

  it('applies again once the wheel has settled', () => {
    const state = reduce(
      spinning(),
      { type: 'BALANCE_SYNC', balance: 999 },
      { type: 'SPIN_COMPLETE' },
      { type: 'BALANCE_SYNC', balance: 999 },
    )

    expect(state.balance).toBe(999)
  })
})

describe('ROUND_STATE', () => {
  it('clears the table when a new round opens for betting', () => {
    const state = reduce(betting(), { type: 'ROUND_STATE', round: round('r2') })

    expect(state.bets).toEqual([])
    expect(state.phase).toBe('idle')
    expect(state.round?.id).toBe('r2')
  })

  it('leaves the table alone when the same round is re-broadcast', () => {
    const state = reduce(betting(), { type: 'ROUND_STATE', round: round('r1') })

    expect(state.bets).toHaveLength(1)
  })

  it('leaves the table alone when the round moves to spinning', () => {
    const state = reduce(betting(), { type: 'ROUND_STATE', round: round('r1', 'spinning') })

    expect(state.bets).toHaveLength(1)
    expect(state.round?.status).toBe('spinning')
  })

  /*
   * The server opens the next round 3s after the result while the wheel animates
   * for 3.5s, so this always arrives mid-spin. Clearing the pending payout here
   * loses the player their winnings and shows no result at all.
   */
  it('does not discard a result the wheel is still animating', () => {
    const state = reduce(spinning(), { type: 'ROUND_STATE', round: round('r2') })

    expect(state.phase).toBe('spinning')
    expect(state.pendingResult).toBe(WINNING_NUMBER)
    expect(state.pendingPayout).toBe(PAYOUT)
    expect(state.pendingBalance).toBe(SETTLED_BALANCE)
    expect(state.round?.id).toBe('r2')
  })

  it('still pays out when the next round opens before the wheel stops', () => {
    const state = reduce(
      spinning(),
      { type: 'ROUND_STATE', round: round('r2') },
      { type: 'SPIN_COMPLETE' },
    )

    expect(state.lastResult).toBe(WINNING_NUMBER)
    expect(state.lastWinnings).toBe(PAYOUT)
    expect(state.balance).toBe(SETTLED_BALANCE)
    expect(state.history).toEqual([WINNING_NUMBER])
  })
})

describe('CLEAR_BETS', () => {
  it('takes the chips off the table', () => {
    const state = reduce(betting(), { type: 'CLEAR_BETS' })

    expect(state.bets).toEqual([])
  })

  it('does not refund — the balance is the server’s to restate', () => {
    const state = reduce(betting(), { type: 'CLEAR_BETS' })

    expect(state.balance).toBe(OPENING_BALANCE - STAKE)
  })

  it('is refused while the wheel is turning', () => {
    const before = spinning()

    expect(reduce(before, { type: 'CLEAR_BETS' })).toBe(before)
  })

  it('leaves the phase alone', () => {
    const state = reduce(betting(), { type: 'CLEAR_BETS' })

    expect(state.phase).toBe('idle')
  })

  /*
   * Built by hand. Since BET_ACCEPTED started refusing late acceptances there is
   * no action sequence that leaves a chip on the board in the result phase, so
   * ClearBetsButton is always disabled there and this cannot be clicked today.
   * The assertions stay because they are what makes clearing safe to reach again
   * — if a future action puts a chip back on a settled board, clearing it must
   * still not double as a dismiss. DISMISS_RESULT and the next round do that.
   */
  it('would leave the result on screen if a chip ever reached a settled board', () => {
    const settled = reduce(spinning(), { type: 'SPIN_COMPLETE' })
    const withChip: RouletteState = {
      ...settled,
      bets: [{ id: 'bet-late', type: 'red', amount: STAKE }],
    }
    // What ClearBetsButton reads to decide whether it is clickable at all.
    expect(withChip.phase === 'spinning' || withChip.bets.length === 0).toBe(false)

    const cleared = reduce(withChip, { type: 'CLEAR_BETS' })

    // What RouletteBoard reads to decide whether the overlay renders.
    expect(cleared.phase).toBe('result')
    expect(cleared.lastResult).toBe(WINNING_NUMBER)
    expect(cleared.bets).toEqual([])
    expect(cleared.balance).toBe(SETTLED_BALANCE)
    expect(cleared.lastWinnings).toBe(PAYOUT)
    expect(cleared.history).toEqual([WINNING_NUMBER])
  })
})

describe('ROUND_RESULT', () => {
  it('starts the wheel and parks the outcome until it stops', () => {
    const state = spinning()

    expect(state).toMatchObject({
      phase: 'spinning',
      pendingResult: WINNING_NUMBER,
      pendingPayout: PAYOUT,
      pendingBalance: SETTLED_BALANCE,
      lastWinnings: 0,
    })
  })

  it('leaves the on-screen balance behind until the wheel stops', () => {
    expect(spinning().balance).toBe(OPENING_BALANCE - STAKE)
  })

  it('accepts the next result while the previous one is still on screen', () => {
    const state = reduce(
      spinning(),
      { type: 'SPIN_COMPLETE' },
      {
        type: 'ROUND_RESULT',
        winningNumber: 22,
        payout: 0,
        balance: SETTLED_BALANCE,
      },
    )

    expect(state.phase).toBe('spinning')
    expect(state.pendingResult).toBe(22)
  })

  it('ignores a duplicate result for a spin already in flight', () => {
    const before = spinning()
    const after = reduce(before, {
      type: 'ROUND_RESULT',
      winningNumber: 22,
      payout: 500,
      balance: 600,
    })

    expect(after).toBe(before)
  })
})

describe('SPIN_COMPLETE', () => {
  it('settles the balance, the result and the history in one step', () => {
    const state = reduce(spinning(), { type: 'SPIN_COMPLETE' })

    expect(state).toMatchObject({
      phase: 'result',
      balance: SETTLED_BALANCE,
      bets: [],
      lastResult: WINNING_NUMBER,
      lastWinnings: PAYOUT,
      history: [WINNING_NUMBER],
      pendingResult: null,
      pendingPayout: 0,
      pendingBalance: null,
    })
  })

  it('does nothing when no wheel is turning', () => {
    const before = betting()

    expect(reduce(before, { type: 'SPIN_COMPLETE' })).toBe(before)
  })

  it('does nothing between rounds', () => {
    const before = reduce(betting(), { type: 'ROUND_STATE', round: round('r2') })

    expect(reduce(before, { type: 'SPIN_COMPLETE' })).toBe(before)
  })

  /*
   * Built by hand: no sequence of actions reaches a spin without a result today,
   * because ROUND_RESULT sets the phase and the pending result together. This
   * guard is what keeps that true — without it a spin started by some future
   * action would settle on `lastResult: null` and push a null into the history.
   */
  it('does nothing when a spin is somehow running without a result', () => {
    const before: RouletteState = { ...spinning(), pendingResult: null, pendingPayout: 0 }

    expect(reduce(before, { type: 'SPIN_COMPLETE' })).toBe(before)
  })

  it('records history newest first', () => {
    const state = [3, 14, 26].reduce(spinOnce, createInitialRouletteState(OPENING_BALANCE))

    expect(state.history).toEqual([26, 14, 3])
  })

  it(`keeps at most ${HISTORY_LENGTH} results`, () => {
    const numbers = Array.from({ length: HISTORY_LENGTH + 3 }, (_, i) => i + 1)
    const state = numbers.reduce(spinOnce, createInitialRouletteState(OPENING_BALANCE))

    expect(state.history).toHaveLength(HISTORY_LENGTH)
    expect(state.history).toEqual(numbers.slice(-HISTORY_LENGTH).reverse())
  })
})

describe('DISMISS_RESULT', () => {
  it('closes the overlay', () => {
    const state = reduce(spinning(), { type: 'SPIN_COMPLETE' }, { type: 'DISMISS_RESULT' })

    expect(state.phase).toBe('idle')
  })

  it('keeps the result on screen for the history and the balance', () => {
    const state = reduce(spinning(), { type: 'SPIN_COMPLETE' }, { type: 'DISMISS_RESULT' })

    expect(state.lastResult).toBe(WINNING_NUMBER)
    expect(state.balance).toBe(SETTLED_BALANCE)
  })

  it('cannot cut a spin short', () => {
    const before = spinning()

    expect(reduce(before, { type: 'DISMISS_RESULT' })).toBe(before)
  })
})
