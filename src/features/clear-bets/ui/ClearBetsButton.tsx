import { useRouletteStore } from '@/entities/roulette/model/rouletteStore'
import { Button } from '@/shared/ui/Button'

export function ClearBetsButton() {
  const disabled = useRouletteStore(
    (store) => store.phase === 'spinning' || store.bets.length === 0,
  )
  const dispatch = useRouletteStore((store) => store.dispatch)

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
