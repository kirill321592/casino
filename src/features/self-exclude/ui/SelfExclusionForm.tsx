import { useRef, useState } from 'react'
import { useLimitsStore } from '@/entities/limits/model/limitsStore'
import { useSession } from '@/entities/session/model/useSession'
import { selfExclude, SELF_EXCLUSION_DAYS } from '@/shared/api/account'
import { Button } from '@/shared/ui/Button'

const LABELS: Record<(typeof SELF_EXCLUSION_DAYS)[number], string> = {
  1: '24 hours',
  7: '7 days',
  30: '30 days',
  180: '6 months',
}

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/**
 * The one action on the page that cannot be taken back, so it asks twice: pick
 * a length, then confirm in a modal that spells out exactly what happens.
 */
export function SelfExclusionForm() {
  const { signOut } = useSession()
  const clearLimits = useLimitsStore((store) => store.clear)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const keepPlayingRef = useRef<HTMLButtonElement>(null)
  const [days, setDays] = useState<number>(SELF_EXCLUSION_DAYS[1])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const until = dateTime.format(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
  const label = LABELS[days as keyof typeof LABELS]

  const confirm = async () => {
    setPending(true)
    setError(null)
    try {
      await selfExclude(days)
      dialogRef.current?.close()
      clearLimits()
      // The server has already ended the session; this catches the screen up.
      signOut()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start the break. Try again.')
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="m-0 border-0 p-0">
        <legend className="panel-label">Take a break for</legend>
        <div className="flex flex-wrap gap-2">
          {SELF_EXCLUSION_DAYS.map((option) => (
            <label
              key={option}
              className="cursor-pointer rounded-control border border-slate-400/25 px-3 py-2 text-sm transition-colors has-[:checked]:border-gold has-[:checked]:text-gold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold"
            >
              <input
                type="radio"
                name="selfExclusionDays"
                value={option}
                checked={days === option}
                onChange={() => setDays(option)}
                className="sr-only"
              />
              {LABELS[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Button
          variant="danger"
          onClick={() => {
            dialogRef.current?.showModal()
            // The way back gets focus, so a stray Enter cannot start the break.
            keepPlayingRef.current?.focus()
          }}
          className="px-5 py-2.5"
        >
          Take a Break…
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="self-exclusion-title"
        onClose={() => setError(null)}
        className="m-auto max-w-[26rem] rounded-2xl border border-slate-400/25 bg-surface p-6 text-slate-50 backdrop:bg-black/70 overscroll-contain"
      >
        <h3 id="self-exclusion-title" className="m-0 text-lg">
          Take a break for {label}?
        </h3>
        <p className="mt-3 text-sm text-muted text-pretty">
          You will be signed out now, and you won’t be able to sign in or play until{' '}
          <strong className="text-slate-50">{until}</strong>. A break can’t be shortened or
          cancelled once it starts.
        </p>
        {error && (
          <p role="alert" className="mt-3 mb-0 text-sm text-table-red">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            ref={keepPlayingRef}
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
            className="px-4 py-2"
          >
            Keep Playing
          </Button>
          <Button variant="danger" onClick={confirm} disabled={pending} className="px-4 py-2">
            {pending ? 'Starting…' : 'Start My Break'}
          </Button>
        </div>
      </dialog>
    </div>
  )
}
