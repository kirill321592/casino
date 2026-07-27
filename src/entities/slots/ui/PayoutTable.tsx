import { SLOT_SYMBOLS } from '../model/symbols'

/* Rows derive from the symbol definitions, so payout tweaks show up here automatically. */
const rows = [...SLOT_SYMBOLS].sort((a, b) => b.payout3 - a.payout3)

const pairPayouts = SLOT_SYMBOLS.map((entry) => entry.payout2)
const pairRange = `${Math.min(...pairPayouts)}–${Math.max(...pairPayouts)}`

export function PayoutTable() {
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
