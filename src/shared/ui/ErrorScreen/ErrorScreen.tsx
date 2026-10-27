import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface ErrorScreenProps {
  title: string
  /** What happened and what the player can do about it. */
  message: string
  /** The ways out — retry, reload, go back. */
  actions?: ReactNode
  /** Off for screens the player navigated to, like a 404, rather than ran into. */
  alert?: boolean
  className?: string
}

/** Full-page dead end, with a way out of it. */
export function ErrorScreen({
  title,
  message,
  actions,
  alert = true,
  className,
}: ErrorScreenProps) {
  return (
    <div
      role={alert ? 'alert' : undefined}
      className={cn(
        'page-shell flex min-h-screen flex-col items-center justify-center text-center',
        className,
      )}
    >
      <h1 className="m-0 text-2xl text-balance sm:text-[2rem]">{title}</h1>
      <p className="mt-3 max-w-[36rem] text-muted text-pretty">{message}</p>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
