import { CHIP_VALUES } from '@/shared/config/constants'
import { useGame } from '@/app/providers/GameProvider'

export function ChipSelector() {
  const { state, dispatch } = useGame()
  const disabled = state.phase === 'spinning'

  return (
    <div className="chip-selector">
      <span className="panel-label">Chips</span>
      <div className="chip-row">
        {CHIP_VALUES.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`chip ${state.selectedChip === chip ? 'chip-active' : ''}`}
            disabled={disabled}
            onClick={() => dispatch({ type: 'SET_CHIP', chip })}
          >
            ${chip}
          </button>
        ))}
      </div>
    </div>
  )
}
