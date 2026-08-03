import { useEffect, useState } from 'react'
import { useRouletteStore } from '@/entities/roulette/model/rouletteStore'
import {
  countdownProgress,
  formatCountdown,
  remainingMs,
} from '@/entities/roulette/lib/roundCountdown'
import type { RoundState } from '@/shared/api/roulette'

const HEADING_ID = 'round-status-heading'
/* Four a second: the digits only move once, the bar moves smoothly. */
const TICK_MS = 250

/**
 * What the table is doing right now. The server already states how long is left
 * to bet; without this the only cue is the bet buttons quietly going disabled,
 * which tells the player they are too late rather than that they are running out
 * of time.
 *
 * Ticking is kept in this component on purpose: it re-renders several times a
 * second, and the wheel and the betting board must not come with it.
 */
export function RoundStatus() {
  const round = useRouletteStore((store) => store.round)
  const phase = useRouletteStore((store) => store.phase)
  const connected = useRouletteStore((store) => store.connected)

  /*
   * Matches `canPlaceBets`: the round being open is what counts, not whether the
   * previous result is still on screen. Requiring an idle phase here left the
   * countdown hidden until the player dismissed the overlay, by which point they
   * had already lost part of the window.
   */
  const isBetting = round?.status === 'betting' && phase !== 'spinning'

  /*
   * Every round:state — including the one broadcast on each bet — re-anchors the
   * deadline against `performance.now()`, so the countdown self-corrects as the
   * round runs and never depends on the browser's wall clock.
   */
  const [anchor, setAnchor] = useState<Anchor>(() => ({ round: null, at: performance.now() }))
  if (anchor.round !== round) {
    setAnchor({ round, at: performance.now() })
  }

  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (!isBetting) return

    setNow(performance.now())
    const id = setInterval(() => setNow(performance.now()), TICK_MS)
    return () => clearInterval(id)
  }, [isBetting, anchor])

  /*
   * A server that predates `closesIn` sends nothing here, and arithmetic on that
   * renders "NaNs" at the player. Dropping to the status line alone keeps this
   * readable through a rolling deploy where one side is still the old build.
   */
  const counting =
    isBetting && anchor.round && Number.isFinite(anchor.round.closesIn) ? anchor.round : null

  const remaining = counting ? remainingMs(counting.closesIn, now - anchor.at) : null

  return (
    <section className="card mb-4 px-4 py-3 sm:px-5" aria-labelledby={HEADING_ID}>
      <span className="panel-label" id={HEADING_ID}>
        Round
      </span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {/* Changes only when the table changes state, so announcing it is not noisy. */}
        <p className="m-0 min-w-0 font-semibold text-slate-50 text-pretty" aria-live="polite">
          {statusLabel({ connected, phase, hasRound: round !== null, isBetting })}
        </p>

        {remaining !== null && (
          <span
            role="timer"
            // Exposed to assistive tech, but not read out on every tick.
            aria-live="off"
            className="text-2xl font-bold text-gold tabular-nums"
          >
            {formatCountdown(remaining)}
          </span>
        )}
      </div>

      {remaining !== null && round !== null && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-700" aria-hidden="true">
          <div
            className="h-full origin-left rounded-full bg-gold transition-transform duration-300 ease-linear motion-reduce:transition-none"
            style={{ transform: `scaleX(${countdownProgress(remaining, round.durationMs)})` }}
          />
        </div>
      )}

      {round !== null && round.betsCount > 0 && (
        <p className="mt-2 mb-0 text-sm text-muted">
          {round.betsCount === 1 ? '1 bet on the table' : `${round.betsCount} bets on the table`}
        </p>
      )}
    </section>
  )
}

interface Anchor {
  round: RoundState | null
  /** `performance.now()` reading at the moment this round:state arrived. */
  at: number
}

interface StatusInput {
  connected: boolean
  phase: string
  hasRound: boolean
  isBetting: boolean
}

function statusLabel({ connected, phase, hasRound, isBetting }: StatusInput): string {
  if (!connected) return 'Reconnecting to the Table…'
  if (phase === 'spinning') return 'No More Bets — the Wheel Is Spinning'
  if (!hasRound) return 'Waiting for the Table…'
  if (isBetting) return 'Betting Closes In'
  return 'Betting Is Closed'
}
