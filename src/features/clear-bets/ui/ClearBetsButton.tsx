import { useGame } from '@/app/providers/GameProvider'
import { Button } from '@/shared/ui/Button'

export function ClearBetsButton() {
  const { state, dispatch } = useGame()
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
