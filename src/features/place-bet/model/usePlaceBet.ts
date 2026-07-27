import { useRoulette } from '@/entities/roulette/model/RouletteProvider'
import type { BetType } from '@/entities/roulette/model/types'

export function usePlaceBet() {
  const { state, placeBet: sendBet, connected } = useRoulette()

  const placeBet = (type: BetType, value?: number) => {
    sendBet(type, value)
  }

  return {
    placeBet,
    selectedChip: state.selectedChip,
    canBet: connected && state.phase === 'idle' && state.round?.status === 'betting',
  }
}
