import { usePlaceBet } from '../model/usePlaceBet'

export function ColorBetButtons() {
  const { placeBet, canBet } = usePlaceBet()

  return (
    <div className="color-bets">
      <span className="panel-label">Outside bets</span>
      <div className="color-bet-row">
        <button
          type="button"
          className="outside-bet outside-red"
          disabled={!canBet}
          onClick={() => placeBet('red')}
        >
          Red
        </button>
        <button
          type="button"
          className="outside-bet outside-black"
          disabled={!canBet}
          onClick={() => placeBet('black')}
        >
          Black
        </button>
        <button
          type="button"
          className="outside-bet"
          disabled={!canBet}
          onClick={() => placeBet('even')}
        >
          Even
        </button>
        <button
          type="button"
          className="outside-bet"
          disabled={!canBet}
          onClick={() => placeBet('odd')}
        >
          Odd
        </button>
      </div>
    </div>
  )
}
