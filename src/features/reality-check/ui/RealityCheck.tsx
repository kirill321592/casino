import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLimitsStore } from '@/entities/limits/model/limitsStore'
import { useAuthUser, useSession } from '@/entities/session/model/useSession'
import { routes } from '@/shared/config/routes'
import { formatMoney } from '@/shared/lib/formatMoney'
import { reportError } from '@/shared/lib/reportError'
import { Button, buttonClassName } from '@/shared/ui/Button'
import { nextCheckAt, resumePlaySession, type PlaySession } from '../model/playSession'

/**
 * Interrupts play at the interval the player chose to say how long they have
 * been at it and where their balance stands against when they sat down. Mount
 * once, for as long as someone is signed in.
 *
 * The interval lives on the server with the other limits, so it follows the
 * account; this also owns loading those limits and forgetting them on sign-out.
 */
export function RealityCheck() {
  const user = useAuthUser()
  const { signOut } = useSession()
  const minutes = useLimitsStore((store) => store.limits?.realityCheckMinutes ?? null)
  const load = useLimitsStore((store) => store.load)
  const clear = useLimitsStore((store) => store.clear)

  const [session] = useState<PlaySession>(() => resumePlaySession(user.id, user.balance))
  const [shownAt, setShownAt] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const keepPlayingRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    load().catch(reportError)
    return clear
  }, [load, clear])

  /* Re-armed after every reminder, and whenever the interval is changed. */
  useEffect(() => {
    if (minutes === null || shownAt !== null) return
    const delay = nextCheckAt(session.startedAt, minutes * 60_000) - Date.now()
    const timer = setTimeout(() => setShownAt(Date.now()), delay)
    return () => clearTimeout(timer)
  }, [minutes, session.startedAt, shownAt])

  useEffect(() => {
    if (shownAt === null) return
    dialogRef.current?.showModal()
    // React's autoFocus fires at mount, before the dialog is open; the safe choice gets focus here instead.
    keepPlayingRef.current?.focus()
  }, [shownAt])

  const dismiss = () => dialogRef.current?.close()

  const elapsed = shownAt === null ? 0 : shownAt - session.startedAt
  const net = user.balance - session.openingBalance

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reality-check-title"
      aria-describedby="reality-check-body"
      // Escape, a button, or a link — however it closes, the next one is armed.
      onClose={() => setShownAt(null)}
      className="m-auto max-w-[26rem] rounded-2xl border border-slate-400/25 bg-surface p-6 text-slate-50 backdrop:bg-black/70 overscroll-contain"
    >
      {shownAt !== null && (
        <>
          <h2 id="reality-check-title" className="m-0 text-xl">
            Reality Check
          </h2>
          <div id="reality-check-body" className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <p className="m-0">
              You have been playing for{' '}
              <strong className="text-slate-50 tabular-nums">{formatDuration(elapsed)}</strong>.
            </p>
            <p className="m-0">
              Since you started:{' '}
              <strong
                className={net < 0 ? 'text-table-red tabular-nums' : 'text-slate-50 tabular-nums'}
              >
                {net < 0 ? `−${formatMoney(-net)}` : `+${formatMoney(net)}`}
              </strong>
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={signOut} className="px-4 py-2">
              Sign Out
            </Button>
            <Link
              to={routes.responsibleGaming}
              onClick={dismiss}
              className={buttonClassName('secondary', 'px-4 py-2 no-underline')}
            >
              Set Limits
            </Link>
            <Button ref={keepPlayingRef} onClick={dismiss} className="flex-none px-4 py-2">
              Keep Playing
            </Button>
          </div>
        </>
      )}
    </dialog>
  )
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}
