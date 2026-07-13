import { getPocketColor } from '@/entities/wheel/model/wheelLayout'
import { usePlaceBet } from '../model/usePlaceBet'

const NUMBERS = Array.from({ length: 37 }, (_, i) => i)

export function NumberGrid() {
  const { placeBet, canBet } = usePlaceBet()

  return (
    <div className="number-grid">
      <span className="panel-label">Straight up</span>
      <div className="number-grid-inner">
        {NUMBERS.map((number) => (
          <button
            key={number}
            type="button"
            className={`number-cell number-${getPocketColor(number)}`}
            disabled={!canBet}
            onClick={() => placeBet('straight', number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  )
}
