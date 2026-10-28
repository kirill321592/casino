import { useState, type FormEvent } from 'react'
import { useLimitsStore } from '@/entities/limits/model/limitsStore'
import { REALITY_CHECK_MINUTES, type PlayLimits } from '@/shared/api/account'
import { formatMoney } from '@/shared/lib/formatMoney'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

const MAX_LIMIT = 1_000_000
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

interface LimitsFormProps {
  limits: PlayLimits
}

type Feedback = { tone: 'ok' | 'error'; message: string } | null

export function LimitsForm({ limits }: LimitsFormProps) {
  const save = useLimitsStore((store) => store.save)
  const [lossLimit, setLossLimit] = useState(limits.dailyLossLimit?.toString() ?? '')
  const [realityCheck, setRealityCheck] = useState(limits.realityCheckMinutes?.toString() ?? '')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    const trimmed = lossLimit.trim()
    const amount = trimmed === '' ? null : Number(trimmed)
    if (amount !== null && (!Number.isInteger(amount) || amount < 1 || amount > MAX_LIMIT)) {
      setFieldError(
        `Enter whole dollars from 1 to ${MAX_LIMIT.toLocaleString()}, or leave it empty.`,
      )
      return
    }
    setFieldError(null)

    setPending(true)
    try {
      const saved = await save({
        dailyLossLimit: amount,
        realityCheckMinutes: realityCheck === '' ? null : Number(realityCheck),
      })
      setFeedback({ tone: 'ok', message: describeSaved(saved, amount) })
    } catch (cause) {
      setFeedback({
        tone: 'error',
        message: cause instanceof Error ? cause.message : 'Could not save. Try again.',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <LossToday limits={limits} />

      <div>
        <label className="panel-label" htmlFor="limits-loss">
          Daily loss limit (USD)
        </label>
        <Input
          id="limits-loss"
          name="dailyLossLimit"
          inputMode="numeric"
          autoComplete="off"
          placeholder="No limit, e.g. 100…"
          value={lossLimit}
          onChange={(event) => setLossLimit(event.target.value)}
          disabled={pending}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? 'limits-loss-error' : 'limits-loss-hint'}
          className="max-w-[14rem] tabular-nums"
        />
        {fieldError ? (
          <p id="limits-loss-error" role="alert" className="mt-2 mb-0 text-sm text-table-red">
            {fieldError}
          </p>
        ) : (
          <p id="limits-loss-hint" className="mt-2 mb-0 text-xs text-faint text-pretty">
            Stakes minus winnings, per day, resetting at midnight UTC. Lowering it applies at once;
            raising or removing it waits {limits.coolingOffHours} hours.
          </p>
        )}
      </div>

      <div>
        <label className="panel-label" htmlFor="limits-reality">
          Reality check
        </label>
        <select
          id="limits-reality"
          name="realityCheckMinutes"
          value={realityCheck}
          onChange={(event) => setRealityCheck(event.target.value)}
          disabled={pending}
          aria-describedby="limits-reality-hint"
          className="rounded-control border border-slate-400/25 bg-ink px-3 py-2 text-slate-50"
        >
          {REALITY_CHECK_MINUTES.map((minutes) => (
            <option key={minutes} value={minutes}>
              Every{' '}
              {minutes < 60
                ? `${minutes} minutes`
                : `${minutes / 60} hour${minutes > 60 ? 's' : ''}`}
            </option>
          ))}
          <option value="">Off</option>
        </select>
        <p id="limits-reality-hint" className="mt-2 mb-0 text-xs text-faint">
          A reminder of how long you have been playing and where you stand.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="flex-none px-5 py-2.5">
          {pending ? 'Saving…' : 'Save Limits'}
        </Button>
        <p
          aria-live="polite"
          className={
            feedback?.tone === 'error' ? 'm-0 text-sm text-table-red' : 'm-0 text-sm text-muted'
          }
        >
          {feedback?.message}
        </p>
      </div>
    </form>
  )
}

function LossToday({ limits }: { limits: PlayLimits }) {
  const { lossToday, dailyLossLimit, pendingDailyLossLimit } = limits

  return (
    <div className="rounded-xl border border-hairline/60 bg-ink/50 p-4 text-sm">
      <p className="m-0">
        Lost today:{' '}
        <strong className="tabular-nums">
          {formatMoney(lossToday)}
          {dailyLossLimit !== null && ` of ${formatMoney(dailyLossLimit)}`}
        </strong>
      </p>
      {dailyLossLimit !== null && (
        <div
          role="progressbar"
          aria-label="Share of today’s loss limit used"
          aria-valuemin={0}
          aria-valuemax={dailyLossLimit}
          aria-valuenow={Math.min(lossToday, dailyLossLimit)}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700"
        >
          <div
            className="h-full origin-left rounded-full bg-gold"
            style={{ transform: `scaleX(${Math.min(1, lossToday / dailyLossLimit)})` }}
          />
        </div>
      )}
      {pendingDailyLossLimit && (
        <p className="mt-3 mb-0 text-muted">
          {pendingDailyLossLimit.amount === null
            ? 'Your limit is being removed'
            : `Your limit changes to ${formatMoney(pendingDailyLossLimit.amount)}`}{' '}
          on {dateTime.format(new Date(pendingDailyLossLimit.effectiveAt))}.
        </p>
      )}
    </div>
  )
}

/* Says what actually happened, which for a looser limit is "not yet". */
function describeSaved(saved: PlayLimits, requested: number | null): string {
  const pending = saved.pendingDailyLossLimit
  if (pending && pending.amount === requested) {
    return `Saved. The looser limit applies from ${dateTime.format(new Date(pending.effectiveAt))}.`
  }
  return 'Saved.'
}
