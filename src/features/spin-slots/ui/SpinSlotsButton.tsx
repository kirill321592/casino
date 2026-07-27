import { Button } from '@/shared/ui/Button'
import { formatMoney } from '@/shared/lib/formatMoney'

interface SpinSlotsButtonProps {
  bet: number
  spinning: boolean
  canAfford: boolean
  connected: boolean
  onSpin: () => void
}

export function SpinSlotsButton({
  bet,
  spinning,
  canAfford,
  connected,
  onSpin,
}: SpinSlotsButtonProps) {
  return (
    <>
      <Button
        variant="primary"
        className="min-h-12 w-full max-w-[16rem] text-base"
        disabled={spinning || !canAfford || !connected}
        onClick={onSpin}
      >
        {spinning ? 'Spinning…' : `Spin — ${formatMoney(bet)}`}
      </Button>
      {!connected && <p className="m-0 text-faint">Connecting to the slots server…</p>}
      {connected && !canAfford && !spinning && (
        <p className="m-0 text-faint">Not enough balance for this bet.</p>
      )}
    </>
  )
}
