import { useGame } from '@/app/providers/GameProvider'
import type { PixiRouletteHandle } from '@/entities/wheel/ui/PixiRoulette'
import type { RefObject } from 'react'

export function useSpinWheel(wheelRef: RefObject<PixiRouletteHandle | null>) {
  void wheelRef
  const { state } = useGame()

  const spin = async () => undefined

  const canSpin =
    false

  return { spin, canSpin, isSpinning: state.phase === 'spinning' }
}
