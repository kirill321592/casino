import { CHIP_VALUES } from '@/shared/config/constants'
import { ChipButton } from '@/shared/ui/ChipButton'

interface SlotsBetSelectorProps {
  bet: number
  disabled: boolean
  onSelect: (bet: number) => void
}

export function SlotsBetSelector({ bet, disabled, onSelect }: SlotsBetSelectorProps) {
  return (
    <div>
      <span className="panel-label">Bet</span>
      <div className="flex flex-wrap gap-2">
        {CHIP_VALUES.map((chip) => (
          <ChipButton
            key={chip}
            value={chip}
            selected={bet === chip}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
