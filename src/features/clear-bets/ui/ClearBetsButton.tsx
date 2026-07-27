import { useRoulette } from '@/entities/roulette/model/RouletteProvider'
import { Button } from '@/shared/ui/Button'

export function ClearBetsButton() {
  const { state, dispatch } = useRoulette()
  const disabled = state.phase === 'spinning' || state.bets.length === 0

  return (
    <Button
      variant="secondary"
      disabled={disabled}
      onClick={() => dispatch({ type: 'CLEAR_BETS' })}
    >
      Clear bets
    </Button>
  )
}
