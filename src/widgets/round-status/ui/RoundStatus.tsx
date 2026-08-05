import { useLayoutEffect, useState, type CSSProperties } from 'react'
import { useRouletteStore } from '@/entities/roulette/model/rouletteStore'
import {
  countdownProgress,
  formatCountdown,
  remainingMs,
} from '@/entities/roulette/lib/roundCountdown'
import type { RoulettePhase } from '@/entities/roulette/model/rouletteReducer'
import type { RoundState } from '@/shared/api/roulette'

const HEADING_ID = 'round-status-heading'

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

  /** Not-a-number until the first tick, which is also what an old server leaves it as. */
  const [remaining, setRemaining] = useState(Number.NaN)

  /*
   * Every round:state — including the one broadcast on each bet — restarts this,
   * so `arrived` re-anchors the countdown against `performance.now()`: it
   * self-corrects as the round runs and never depends on the browser's wall
   * clock. Layout, not passive, so the first frame of a round never paints the
   * previous one's time.
   *
   * Re-armed for the exact moment the label's next second lands rather than at a
   * fixed rate: the digits change on the beat instead of up to a tick late, and
   * the bar needs no help from React at all.
   */
  useLayoutEffect(() => {
    if (!isBetting || round === null) return

    const arrived = performance.now()
    let timer = 0

    const tick = () => {
      const left = remainingMs(round.closesIn, performance.now() - arrived)
      setRemaining(left)
      // NaN from a server too old to send `closesIn` fails this and stops here.
      if (left > 0) timer = setTimeout(tick, left % 1000 || 1000)
    }

    tick()
    return () => clearTimeout(timer)
  }, [isBetting, round])

  /*
   * A server that predates `closesIn` sends nothing here, and arithmetic on that
   * renders "NaNs" at the player. Dropping to the status line alone keeps this
   * readable through a rolling deploy where one side is still the old build.
   */
  const countdown =
    isBetting && round !== null && Number.isFinite(remaining) ? countdownOf(round, remaining) : null

  return (
    <section className="card mb-4 px-4 py-3 sm:px-5" aria-labelledby={HEADING_ID}>
      <span className="panel-label" id={HEADING_ID}>
        Round
      </span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 min-w-0 font-semibold text-slate-50 text-pretty" aria-live="polite">
          {statusLabel(connected, phase, round)}
        </p>

        {countdown && (
          <span
            role="timer"
            // Exposed to assistive tech, but not read out on every tick.
            aria-live="off"
            className="text-2xl font-bold text-gold tabular-nums"
          >
            {countdown.label}
          </span>
        )}
      </div>

      {countdown && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-700" aria-hidden="true">
          <div
            /* A fresh element per round:state: the animation replays from the time just reported. */
            key={countdown.key}
            /*
             * Its own layer, so the wheel's canvas work cannot stutter it.
             *
             * Deliberately not disabled under prefers-reduced-motion: the drain is
             * the information, the way a video scrubber is, and the alternative is
             * a bar that jumps a step every second. Nothing here spins, parallaxes
             * or scales the page — the risk that setting guards against.
             */
            className="h-full origin-left rounded-full bg-gold will-change-transform animate-countdown"
            style={
              {
                // Base value, in case the animation cannot run at all.
                transform: `scaleX(${countdown.progress})`,
                '--countdown-from': countdown.from,
                animationDuration: `${countdown.windowMs}ms`,
              } as CSSProperties
            }
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

/**
 * Everything the countdown puts on screen. The label ticks; the bar's two inputs
 * come straight off the round and so hold still for as long as this round:state
 * is the current one. Deriving them from the ticking value instead rewrites the
 * running animation once a second, and the browser re-resolves the keyframes and
 * re-times the timeline under it — a visible hitch on every tick.
 */
function countdownOf(round: RoundState, remaining: number) {
  return {
    label: formatCountdown(remaining),
    /* Stepped stand-in for reduced motion, where the animation is off. */
    progress: countdownProgress(remaining, round.durationMs),
    from: countdownProgress(round.closesIn, round.durationMs),
    windowMs: round.closesIn,
    key: `${round.id}:${round.closesIn}`,
  }
}

/* Reached only past the spinning check, so an open round here is one being bet on. */
function statusLabel(connected: boolean, phase: RoulettePhase, round: RoundState | null): string {
  if (!connected) return 'Reconnecting to the Table…'
  if (phase === 'spinning') return 'No More Bets — the Wheel Is Spinning'
  if (round === null) return 'Waiting for the Table…'
  if (round.status === 'betting') return 'Betting Closes In'
  return 'Betting Is Closed'
}
