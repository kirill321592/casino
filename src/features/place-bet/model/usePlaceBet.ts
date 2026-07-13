import { useGame } from '@/app/providers/GameProvider'
import type { BetType } from '@/entities/bet/model/types'

export function usePlaceBet() {
  const { state, placeBet: sendBet, connected } = useGame()

  const placeBet = (type: BetType, value?: number) => {
    sendBet(type, value)
  }

  return {
    placeBet,
    selectedChip: state.selectedChip,
    canBet: connected && state.phase === 'idle' && state.round?.status === 'betting',
  }
}
