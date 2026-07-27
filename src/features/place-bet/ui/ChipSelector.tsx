import { CHIP_VALUES } from '@/shared/config/constants'
import { useRoulette } from '@/entities/roulette/model/RouletteProvider'
import { ChipButton } from '@/shared/ui/ChipButton'

export function ChipSelector() {
  const { state, dispatch } = useRoulette()
  const disabled = state.phase === 'spinning'

  return (
    <div>
      <span className="panel-label">Chips</span>
      <div className="flex flex-wrap gap-2">
        {CHIP_VALUES.map((chip) => (
          <ChipButton
            key={chip}
            value={chip}
            selected={state.selectedChip === chip}
            disabled={disabled}
            onSelect={(value) => dispatch({ type: 'SET_CHIP', chip: value })}
          />
        ))}
      </div>
    </div>
  )
}
