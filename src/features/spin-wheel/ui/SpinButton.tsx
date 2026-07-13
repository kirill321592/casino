import { Button } from '@/shared/ui/Button'
import type { PixiRouletteHandle } from '@/entities/wheel/ui/PixiRoulette'
import type { RefObject } from 'react'
import { useSpinWheel } from '../model/useSpinWheel'

interface SpinButtonProps {
  wheelRef: RefObject<PixiRouletteHandle | null>
}

export function SpinButton({ wheelRef }: SpinButtonProps) {
  const { isSpinning } = useSpinWheel(wheelRef)

  return (
    <Button
      variant="primary"
      className="spin-button"
      disabled
    >
      {isSpinning ? 'Spinning…' : 'Spin'}
    </Button>
  )
}
