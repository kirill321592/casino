import { cn } from '@/shared/lib/cn'

interface CanvasPlaceholderProps {
  /** What is being built. Announced politely, so it ends in an ellipsis. */
  label: string
  /** Silhouette of the scene this stands in for. */
  shape: 'cabinet' | 'wheel'
  className?: string
}

/**
 * Stands in for a game canvas until its first frame is on screen.
 *
 * A WebGL scene costs a second or two to build and light, and an empty box for
 * that long reads as a broken page. This fills the same footprint with the
 * shape the player is waiting for, so the wait looks deliberate.
 */
export function CanvasPlaceholder({ label, shape, className }: CanvasPlaceholderProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4',
        className,
      )}
    >
      {shape === 'cabinet' ? <CabinetSkeleton /> : <WheelSkeleton />}
      <p className="absolute bottom-[8%] m-0 text-sm text-faint" role="status">
        {label}
      </p>
    </div>
  )
}

/* Reel window between two cabinet panels — the slot machine, roughly framed. */
function CabinetSkeleton() {
  return (
    <div className="flex h-[42%] w-[74%] items-stretch gap-[1.5%] rounded-xl border border-gold/25 bg-black/40 p-[1.5%]">
      {[0, 1, 2].map((reel) => (
        <div
          key={reel}
          style={{ animationDelay: `${reel * 160}ms` }}
          className="flex-1 animate-canvas-shimmer rounded-md bg-gradient-to-b from-slate-400/25 via-slate-200/15 to-slate-400/25 motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}

/* Rim, track and hub of the wheel, concentric. */
function WheelSkeleton() {
  return (
    <div className="grid aspect-square w-[72%] place-items-center rounded-full border border-gold/25 bg-black/40">
      <div className="grid aspect-square w-[72%] animate-canvas-shimmer place-items-center rounded-full border border-slate-400/25 bg-slate-400/10 motion-reduce:animate-none">
        <div className="aspect-square w-[38%] rounded-full border border-gold/20 bg-gold/10" />
      </div>
    </div>
  )
}
