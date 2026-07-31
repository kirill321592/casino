import { Button } from '@/shared/ui/Button'
import { formatMoney } from '@/shared/lib/formatMoney'

interface SpinSlotsButtonProps {
  bet: number
  spinning: boolean
  canAfford: boolean
  onSpin: () => void
}

export function SpinSlotsButton({ bet, spinning, canAfford, onSpin }: SpinSlotsButtonProps) {
  return (
    <>
      <Button
        variant="primary"
        className="min-h-12 w-full max-w-[16rem] text-base"
        disabled={spinning || !canAfford}
        onClick={onSpin}
      >
        {spinning ? 'Spinning…' : `Spin — ${formatMoney(bet)}`}
      </Button>
      {!canAfford && !spinning && (
        <p className="m-0 text-faint">Not enough balance for this bet.</p>
      )}
    </>
  )
}
