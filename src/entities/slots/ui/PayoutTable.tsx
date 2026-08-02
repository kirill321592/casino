import { memo, useMemo } from 'react'
import type { SlotsPaytable } from '@/shared/api/slots'

interface PayoutTableProps {
  paytable: SlotsPaytable
}

/*
 * Rows come straight from the server paytable, so payout tweaks need no redeploy.
 * memo: the paytable is fetched once, so this never has to redraw for a spin.
 */
export const PayoutTable = memo(function PayoutTable({ paytable }: PayoutTableProps) {
  const { rows, pairRange } = useMemo(() => {
    const symbols = paytable.symbols

    let lowest = symbols[0]?.payout2 ?? 0
    let highest = lowest
    for (const { payout2 } of symbols) {
      if (payout2 < lowest) lowest = payout2
      if (payout2 > highest) highest = payout2
    }

    return {
      // toSorted, not sort — `symbols` is state owned by the caller.
      rows: symbols.toSorted((a, b) => b.payout3 - a.payout3),
      pairRange: `${lowest}–${highest}`,
    }
  }, [paytable])

  return (
    <div>
      <span className="panel-label">Payouts (× bet)</span>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm text-muted">
        {rows.map(({ symbol, payout3 }) => (
          <li key={symbol}>
            {symbol} {symbol} {symbol} — {payout3}×
          </li>
        ))}
        <li>Any pair — {pairRange}×</li>
      </ul>
    </div>
  )
})
