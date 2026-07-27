import type { SlotsPaytable } from '@/shared/api/slots'

interface PayoutTableProps {
  paytable: SlotsPaytable
}

/* Rows come straight from the server paytable, so payout tweaks need no redeploy. */
export function PayoutTable({ paytable }: PayoutTableProps) {
  const rows = [...paytable.symbols].sort((a, b) => b.payout3 - a.payout3)
  const pairPayouts = paytable.symbols.map((entry) => entry.payout2)
  const pairRange = `${Math.min(...pairPayouts)}–${Math.max(...pairPayouts)}`

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
}
