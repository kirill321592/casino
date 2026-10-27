import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

interface CanvasUnavailableProps {
  onRetry: () => void
  className?: string
}

/**
 * Takes the canvas's place when its 3D view could not be built or was lost for
 * good. The game itself does not depend on the view — results still arrive
 * and settle — so this says so rather than blocking play.
 */
export function CanvasUnavailable({ onRetry, className }: CanvasUnavailableProps) {
  return (
    <div
      role="alert"
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl border border-hairline bg-black/40 p-6 text-center',
        className,
      )}
    >
      <p className="m-0 max-w-[24rem] text-sm text-muted text-pretty">
        The 3D view couldn’t start on this device. You can keep playing — every result still shows
        up on screen.
      </p>
      <Button variant="secondary" onClick={onRetry} className="px-4 py-2">
        Try Again
      </Button>
    </div>
  )
}
