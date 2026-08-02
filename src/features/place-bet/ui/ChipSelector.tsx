import { CHIP_VALUES } from '@/shared/config/constants'
import { useRouletteStore } from '@/entities/roulette/model/rouletteStore'
import { ChipButton } from '@/shared/ui/ChipButton'

export function ChipSelector() {
  const selectedChip = useRouletteStore((store) => store.selectedChip)
  const disabled = useRouletteStore((store) => store.phase === 'spinning')
  const dispatch = useRouletteStore((store) => store.dispatch)

  return (
    <div>
      <span className="panel-label">Chips</span>
      <div className="flex flex-wrap gap-2">
        {CHIP_VALUES.map((chip) => (
          <ChipButton
            key={chip}
            value={chip}
            selected={selectedChip === chip}
            disabled={disabled}
            onSelect={(value) => dispatch({ type: 'SET_CHIP', chip: value })}
          />
        ))}
      </div>
    </div>
  )
}
