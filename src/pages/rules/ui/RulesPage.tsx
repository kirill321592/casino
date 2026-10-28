import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BET_PAYOUTS, ROULETTE_RTP } from '@/entities/roulette/model/payouts'
import { FALLBACK_PAYTABLE } from '@/entities/slots/model/symbols'
import { fetchPaytable, type SlotsPaytable } from '@/shared/api/slots'
import { routes } from '@/shared/config/routes'
import { formatPercent } from '@/shared/lib/formatPercent'
import { DocumentPage, DocumentSection } from '@/shared/ui/DocumentPage'

/*
 * Public, so a player can read exactly how each game pays before opening an
 * account. Slots figures come from the server's paytable — the same one that
 * settles spins — and fall back to the shipped copy if it cannot be reached.
 */
export function RulesPage() {
  const paytable = useServerPaytable()

  return (
    <DocumentPage
      title="Game Rules"
      lede="How each game works, what every bet pays, and how much of what is staked each game returns on average."
    >
      <DocumentSection id="rtp" title="Return to Player">
        <p>
          Return to player (RTP) is the share of all money staked that a game pays back over a very
          long run of play. It is an average, not a promise: any single session can end well above
          or below it, and the difference is the house edge.
        </p>
        <table className="w-full border-collapse text-left">
          <thead className="text-xs uppercase tracking-[0.08em] text-muted">
            <tr>
              <th scope="col" className="pb-2 font-normal">
                Game
              </th>
              <th scope="col" className="pb-2 text-right font-normal">
                RTP
              </th>
              <th scope="col" className="pb-2 text-right font-normal">
                House edge
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            <RtpRow game="European Roulette" rtp={ROULETTE_RTP} />
            <RtpRow game="Lucky Slots" rtp={paytable.rtp} />
          </tbody>
        </table>
      </DocumentSection>

      <DocumentSection id="roulette" title="European Roulette">
        <p>
          The wheel has 37 pockets: 0 to 36, with a single zero. A new round opens every few
          seconds; place chips while betting is open, and the wheel spins once it closes. Every
          player at the table shares the same spin.
        </p>
        <table className="w-full border-collapse text-left">
          <thead className="text-xs uppercase tracking-[0.08em] text-muted">
            <tr>
              <th scope="col" className="pb-2 font-normal">
                Bet
              </th>
              <th scope="col" className="pb-2 font-normal">
                Covers
              </th>
              <th scope="col" className="pb-2 text-right font-normal">
                Returns
              </th>
            </tr>
          </thead>
          <tbody>
            {BET_PAYOUTS.map(({ bet, covers, returns }) => (
              <tr key={bet} className="border-t border-hairline/60">
                <td className="py-2">{bet}</td>
                <td className="py-2 text-muted">{covers}</td>
                <td className="py-2 text-right tabular-nums">{returns}× stake</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-muted">
          “Returns” includes the stake: a winning $10 straight-up bet pays back $360. When the ball
          lands on 0, every outside bet loses.
        </p>
      </DocumentSection>

      <DocumentSection id="slots" title="Lucky Slots">
        <p>
          Three reels, one payline through the middle row. Each spin is independent of every spin
          before it. The best matching line pays: three of a kind, otherwise a pair anywhere on the
          line.
        </p>
        <table className="w-full border-collapse text-left">
          <thead className="text-xs uppercase tracking-[0.08em] text-muted">
            <tr>
              <th scope="col" className="pb-2 font-normal">
                Symbol
              </th>
              <th scope="col" className="pb-2 text-right font-normal">
                Three
              </th>
              <th scope="col" className="pb-2 text-right font-normal">
                Pair
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {paytable.symbols
              .toSorted((a, b) => b.payout3 - a.payout3)
              .map((entry) => (
                <tr key={entry.symbol} className="border-t border-hairline/60">
                  <td className="py-2 text-lg">{entry.symbol}</td>
                  <td className="py-2 text-right">{entry.payout3}× bet</td>
                  <td className="py-2 text-right">{entry.payout2}× bet</td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className="text-muted">
          The bet is taken when the reels start and the payout is added on top, so a 1× pair gives
          your stake back.
        </p>
      </DocumentSection>

      <DocumentSection title="Fair Play">
        <p>
          Every result is drawn on the server, never in your browser, and is settled before the
          animation you see begins. If your connection drops mid-round, the round still settles and
          your balance reflects it when you reconnect.
        </p>
        <p>
          Set limits or take a break at any time from{' '}
          <Link to={routes.responsibleGaming} className="font-bold text-gold hover:text-gold-soft">
            Responsible Gaming
          </Link>
          .
        </p>
      </DocumentSection>
    </DocumentPage>
  )
}

function RtpRow({ game, rtp }: { game: string; rtp: number }) {
  return (
    <tr className="border-t border-hairline/60">
      <th scope="row" className="py-2 font-normal">
        {game}
      </th>
      <td className="py-2 text-right">{formatPercent(rtp)}</td>
      <td className="py-2 text-right text-muted">{formatPercent(1 - rtp)}</td>
    </tr>
  )
}

function useServerPaytable(): SlotsPaytable {
  const [paytable, setPaytable] = useState(FALLBACK_PAYTABLE)

  useEffect(() => {
    const controller = new AbortController()
    fetchPaytable(controller.signal)
      .then(setPaytable)
      // The shipped copy is already on screen; nothing to tell the reader.
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  return paytable
}
