import { Link } from 'react-router'
import { routes } from '@/shared/config/routes'
import { DocumentPage, DocumentSection } from '@/shared/ui/DocumentPage'

/*
 * Every account records the version it accepted (TERMS_VERSION on the server).
 * Change the wording here and that constant moves with it, so the record still
 * says which text a player agreed to.
 *
 * This text is a working draft. It needs review by counsel for each market the
 * casino operates in before it is relied on.
 */
const LAST_UPDATED = 'October 28, 2026'

const linkClass = 'font-bold text-gold hover:text-gold-soft'

export function TermsPage() {
  return (
    <DocumentPage title="Terms of Use" lede={`Last updated ${LAST_UPDATED}.`}>
      <DocumentSection title="1. Who May Play">
        <p>
          You must be 18 years of age or older, or the legal age for gambling where you live if that
          is higher, to open an account or play. You confirm this when you sign up, and we may close
          any account where it turns out not to be true.
        </p>
        <p>
          It is your responsibility to make sure online casino games are legal where you are. Do not
          use the casino anywhere they are not.
        </p>
      </DocumentSection>

      <DocumentSection title="2. Your Account">
        <p>
          One account per person. Keep your password to yourself — everything done with your account
          is treated as done by you. Usernames are shown to other players, so do not use your real
          name or anything offensive.
        </p>
      </DocumentSection>

      <DocumentSection title="3. Balance and Bets">
        <p>
          Your balance is held on our servers, and the figure they report is the one that counts. A
          bet is final once it is accepted: the stake leaves your balance at that moment, and any
          winnings are added when the round settles.
        </p>
        <p>
          If a fault affects a round — a server error, a game paying out against its published rules
          — we may void the affected bets and return the stakes. How each game pays is set out in
          the{' '}
          <Link to={routes.rules} className={linkClass}>
            Game Rules
          </Link>
          .
        </p>
      </DocumentSection>

      <DocumentSection title="4. Fair Play">
        <p>
          Results are drawn on the server by a random number generator. Using bots, scripts or any
          other way of interfering with games or other players is not allowed, and we may close
          accounts that do.
        </p>
      </DocumentSection>

      <DocumentSection title="5. Playing Responsibly">
        <p>
          Gambling should be entertainment, never a way to make money or recover losses. You can set
          a daily loss limit, choose how often you are reminded how long you have been playing, or
          take a break from play entirely, from{' '}
          <Link to={routes.responsibleGaming} className={linkClass}>
            Responsible Gaming
          </Link>
          . A break cannot be cut short once it has started.
        </p>
      </DocumentSection>

      <DocumentSection title="6. Changes">
        <p>
          We may update these terms. When we do, the date above changes, and continuing to play
          means you accept the new version.
        </p>
      </DocumentSection>
    </DocumentPage>
  )
}
