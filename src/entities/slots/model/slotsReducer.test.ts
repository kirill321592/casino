import { describe, expect, it } from 'vitest'
import { CHIP_VALUES, DEFAULT_CHIP, HISTORY_LENGTH } from '@/shared/config/constants'
import {
  createInitialSlotsState,
  slotsReducer,
  type SlotsAction,
  type SlotsState,
} from './slotsReducer'

const OPENING_BALANCE = 100
const LOSING_REELS = ['🍒', '🍋', '🔔']
const WINNING_REELS = ['💎', '💎', '💎']

function reduce(state: SlotsState, ...actions: SlotsAction[]): SlotsState {
  return actions.reduce<SlotsState>(slotsReducer, state)
}

function idle(balance = OPENING_BALANCE): SlotsState {
  return createInitialSlotsState(balance)
}

/** Lever pulled, stake gone, nothing back from the server yet. */
function awaitingResult(balance = OPENING_BALANCE): SlotsState {
  return reduce(idle(balance), { type: 'SPIN_REQUEST' })
}

/** Reels are in and turning; the payout lands on SPIN_COMPLETE. */
function reelsArrived(winnings: number): SlotsState {
  const state = awaitingResult()
  return reduce(state, {
    type: 'SPIN_RESULT',
    reels: winnings > 0 ? WINNING_REELS : LOSING_REELS,
    winnings,
    balance: state.balance + winnings,
  })
}

/** One full spin the server settles honestly. */
function spinOnce(state: SlotsState, winnings: number): SlotsState {
  const staked = state.balance - state.bet
  return reduce(
    state,
    { type: 'SPIN_REQUEST' },
    {
      type: 'SPIN_RESULT',
      reels: winnings > 0 ? WINNING_REELS : LOSING_REELS,
      winnings,
      balance: staked + winnings,
    },
    { type: 'SPIN_COMPLETE' },
  )
}

describe('createInitialSlotsState', () => {
  it('opens idle on the default chip with three reels showing', () => {
    const state = idle()

    expect(state).toMatchObject({
      phase: 'idle',
      balance: OPENING_BALANCE,
      bet: DEFAULT_CHIP,
      pendingReels: null,
      lastWinnings: 0,
      history: [],
    })
    expect(state.reels).toHaveLength(3)
  })
})

describe('SET_BET', () => {
  it.each(CHIP_VALUES)('accepts the %i chip', (chip) => {
    expect(reduce(idle(), { type: 'SET_BET', bet: chip }).bet).toBe(chip)
  })

  // The server prices spins off a fixed set of stakes; anything else is a 400.
  it.each([0, -5, 7, 50, 1000, Number.NaN])('refuses %p, which is not a chip', (bet) => {
    expect(reduce(idle(), { type: 'SET_BET', bet }).bet).toBe(DEFAULT_CHIP)
  })

  it('is refused while the reels are turning', () => {
    const before = awaitingResult()

    expect(reduce(before, { type: 'SET_BET', bet: 100 })).toBe(before)
  })
})

describe('SPIN_REQUEST', () => {
  it('takes the stake the moment the lever is pulled', () => {
    const state = awaitingResult()

    expect(state.phase).toBe('spinning')
    expect(state.balance).toBe(OPENING_BALANCE - DEFAULT_CHIP)
  })

  it('clears the previous result so the overlay cannot linger', () => {
    const state = reduce(spinOnce(idle(), 40), { type: 'SPIN_REQUEST' })

    expect(state.lastWinnings).toBe(0)
    expect(state.pendingReels).toBeNull()
    expect(state.pendingBalance).toBeNull()
  })

  it('refuses a stake the player cannot cover', () => {
    const before = idle(DEFAULT_CHIP - 1)

    expect(reduce(before, { type: 'SPIN_REQUEST' })).toBe(before)
  })

  it('allows a stake that spends the balance exactly', () => {
    const state = reduce(idle(DEFAULT_CHIP), { type: 'SPIN_REQUEST' })

    expect(state.phase).toBe('spinning')
    expect(state.balance).toBe(0)
  })

  // A double-click must not cost two stakes for one spin.
  it('cannot be stacked on a spin already running', () => {
    const before = awaitingResult()

    expect(reduce(before, { type: 'SPIN_REQUEST' })).toBe(before)
  })
})

describe('SPIN_RESULT', () => {
  it('parks the outcome until the reels finish', () => {
    const state = reelsArrived(40)

    expect(state.phase).toBe('spinning')
    expect(state.pendingReels).toEqual(WINNING_REELS)
    expect(state.pendingWinnings).toBe(40)
    expect(state.reels).not.toEqual(WINNING_REELS)
    expect(state.lastWinnings).toBe(0)
  })

  it('ignores a second answer for the same spin', () => {
    const before = reelsArrived(0)
    const after = reduce(before, {
      type: 'SPIN_RESULT',
      reels: WINNING_REELS,
      winnings: 4000,
      balance: 4095,
    })

    expect(after).toBe(before)
  })

  it('ignores an answer that arrives after the spin was abandoned', () => {
    const before = reduce(awaitingResult(), { type: 'SPIN_FAILED' })
    const after = reduce(before, {
      type: 'SPIN_RESULT',
      reels: WINNING_REELS,
      winnings: 4000,
      balance: 4095,
    })

    expect(after).toBe(before)
  })
})

describe('SPIN_FAILED', () => {
  it('returns the stake when the spin never reached the server', () => {
    const state = reduce(awaitingResult(), { type: 'SPIN_FAILED' })

    expect(state.phase).toBe('idle')
    expect(state.balance).toBe(OPENING_BALANCE)
  })

  it('refunds the stake actually placed, not the chip selected later', () => {
    const state = reduce(
      idle(),
      { type: 'SET_BET', bet: 25 },
      { type: 'SPIN_REQUEST' },
      // Refused mid-spin — which is what keeps the refund below honest.
      { type: 'SET_BET', bet: 100 },
      { type: 'SPIN_FAILED' },
    )

    expect(state.balance).toBe(OPENING_BALANCE)
  })

  /* The spin did land; refunding here would hand out the stake twice. */
  it('does not refund once the reels have arrived', () => {
    const before = reelsArrived(0)
    const after = reduce(before, { type: 'SPIN_FAILED' })

    expect(after).toBe(before)
    expect(after.balance).toBe(OPENING_BALANCE - DEFAULT_CHIP)
  })

  it('does not refund twice', () => {
    const once = reduce(awaitingResult(), { type: 'SPIN_FAILED' })
    const twice = reduce(once, { type: 'SPIN_FAILED' })

    expect(twice).toBe(once)
    expect(twice.balance).toBe(OPENING_BALANCE)
  })
})

describe('SPIN_COMPLETE', () => {
  it('shows the reels and pays out', () => {
    const state = reduce(reelsArrived(40), { type: 'SPIN_COMPLETE' })

    expect(state).toMatchObject({
      phase: 'result',
      reels: WINNING_REELS,
      lastWinnings: 40,
      pendingReels: null,
      pendingWinnings: 0,
      pendingBalance: null,
    })
  })

  it('settles on the server balance rather than its own arithmetic', () => {
    const state = reduce(
      awaitingResult(),
      // The server is the authority on the balance even when it disagrees.
      { type: 'SPIN_RESULT', reels: WINNING_REELS, winnings: 40, balance: 500 },
      { type: 'SPIN_COMPLETE' },
    )

    expect(state.balance).toBe(500)
    expect(state.lastWinnings).toBe(40)
  })

  /* The reels finished their animation before the request came back. */
  it('does nothing while the spin is still in flight', () => {
    const before = awaitingResult()

    expect(reduce(before, { type: 'SPIN_COMPLETE' })).toBe(before)
  })

  it('does nothing when no spin is running', () => {
    const before = idle()

    expect(reduce(before, { type: 'SPIN_COMPLETE' })).toBe(before)
  })

  it('records history newest first', () => {
    const state = [0, 40, 0].reduce(spinOnce, idle(1000))

    expect(state.history.map((entry) => entry.winnings)).toEqual([0, 40, 0])
    expect(state.history[1]).toEqual({ reels: WINNING_REELS, winnings: 40 })
  })

  it(`keeps at most ${HISTORY_LENGTH} spins`, () => {
    const winnings = Array.from({ length: HISTORY_LENGTH + 3 }, () => 0)
    const state = winnings.reduce(spinOnce, idle(1000))

    expect(state.history).toHaveLength(HISTORY_LENGTH)
  })
})

describe('DISMISS_RESULT', () => {
  it('closes the overlay without disturbing the balance', () => {
    const settled = reduce(reelsArrived(40), { type: 'SPIN_COMPLETE' })
    const state = reduce(settled, { type: 'DISMISS_RESULT' })

    expect(state.phase).toBe('idle')
    expect(state.balance).toBe(settled.balance)
    expect(state.reels).toEqual(WINNING_REELS)
  })

  it('cannot cut a spin short', () => {
    const before = awaitingResult()

    expect(reduce(before, { type: 'DISMISS_RESULT' })).toBe(before)
  })
})

describe('balance over a session', () => {
  /* Every path in and out of the balance, checked end to end. */
  it('nets stakes, payouts and refunds correctly', () => {
    const won = spinOnce(idle(100), 40) // -5 +40
    const lost = spinOnce(won, 0) // -5
    const refunded = reduce(lost, { type: 'SPIN_REQUEST' }, { type: 'SPIN_FAILED' }) // -5 +5

    expect(won.balance).toBe(135)
    expect(lost.balance).toBe(130)
    expect(refunded.balance).toBe(130)
  })
})
