import { PayoutTable } from '@/entities/slots/ui/PayoutTable'
import { SpinHistory } from '@/entities/slots/ui/SpinHistory'
import type { SlotsSpinRecord } from '@/entities/slots/model/slotsReducer'
import type { SlotsPaytable } from '@/shared/api/slots'
import { SlotsBetSelector } from '@/features/spin-slots/ui/SlotsBetSelector'

interface SlotsControlsProps {
  bet: number
  disabled: boolean
  paytable: SlotsPaytable
  history: SlotsSpinRecord[]
  onSelectBet: (bet: number) => void
}

export function SlotsControls({
  bet,
  disabled,
  paytable,
  history,
  onSelectBet,
}: SlotsControlsProps) {
  return (
    <aside className="card flex flex-col gap-5 p-4 sm:p-5">
      <SlotsBetSelector bet={bet} disabled={disabled} onSelect={onSelectBet} />
      <PayoutTable paytable={paytable} />
      <SpinHistory history={history} />
    </aside>
  )
}
