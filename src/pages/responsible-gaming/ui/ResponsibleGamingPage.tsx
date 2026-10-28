import { useEffect, useState } from 'react'
import { useLimitsStore } from '@/entities/limits/model/limitsStore'
import { SelfExclusionForm } from '@/features/self-exclude/ui/SelfExclusionForm'
import { LimitsForm } from '@/features/set-limits/ui/LimitsForm'
import { DocumentPage, DocumentSection } from '@/shared/ui/DocumentPage'

const linkClass = 'font-bold text-gold hover:text-gold-soft'

export function ResponsibleGamingPage() {
  const limits = useLimitsStore((store) => store.limits)
  const load = useLimitsStore((store) => store.load)
  const [loadError, setLoadError] = useState<string | null>(null)

  /* Always refetched here: today's loss has moved since whoever loaded it last. */
  useEffect(() => {
    load().catch((cause: unknown) =>
      setLoadError(cause instanceof Error ? cause.message : 'Could not load your limits.'),
    )
  }, [load])

  return (
    <DocumentPage
      title="Responsible Gaming"
      lede="Gambling should be entertainment. These tools help keep it that way — use them before you need them."
    >
      <DocumentSection id="limits" title="Your Limits">
        {limits ? (
          <LimitsForm limits={limits} />
        ) : loadError ? (
          <p role="alert" className="text-table-red">
            {loadError} Reload the page to try again.
          </p>
        ) : (
          <p role="status" className="text-muted">
            Loading your limits…
          </p>
        )}
      </DocumentSection>

      <DocumentSection id="break" title="Take a Break">
        <p>
          Stops all play on your account for the length you choose. You are signed out straight away
          and cannot sign back in until it ends — not even to end it early.
        </p>
        <SelfExclusionForm />
      </DocumentSection>

      <DocumentSection title="Signs to Watch For">
        <ul className="m-0 flex flex-col gap-1.5 pl-5">
          <li>Playing for longer, or with more money, than you meant to.</li>
          <li>Chasing losses — betting more to win back what is gone.</li>
          <li>Borrowing money, or using money meant for bills, to play.</li>
          <li>Feeling anxious or irritable when you are not playing.</li>
          <li>Hiding how much you play from people close to you.</li>
        </ul>
      </DocumentSection>

      <DocumentSection title="Getting Help">
        <p>
          If any of that sounds familiar, talking to someone helps. These organisations offer free,
          confidential support:
        </p>
        <ul className="m-0 flex flex-col gap-1.5 pl-5">
          <li>
            <a
              href="https://www.gamblersanonymous.org"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Gamblers Anonymous
            </a>{' '}
            — peer support groups worldwide.
          </li>
          <li>
            <a
              href="https://www.begambleaware.org"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              BeGambleAware
            </a>{' '}
            — advice, tools and a free helpline.
          </li>
        </ul>
      </DocumentSection>
    </DocumentPage>
  )
}
