import { useGame } from '@/app/providers/GameProvider'
import { getPocketColor } from '@/entities/wheel/model/wheelLayout'

export function ResultHistory() {
  const { state } = useGame()

  return (
    <div className="result-history">
      <span className="panel-label">History</span>
      <div className="history-row">
        {state.history.length === 0 ? (
          <span className="history-empty">No spins yet</span>
        ) : (
          state.history.map((number, index) => (
            <span
              key={`${number}-${index}`}
              className={`history-pill history-${getPocketColor(number)}`}
            >
              {number}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
