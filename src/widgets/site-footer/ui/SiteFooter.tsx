import { Link } from 'react-router'
import { routes } from '@/shared/config/routes'

const links = [
  { to: routes.rules, label: 'Game Rules' },
  { to: routes.responsibleGaming, label: 'Responsible Gaming' },
  { to: routes.terms, label: 'Terms of Use' },
] as const

/* On every screen, signed in or not: the age rule and the way to help are never more than a scroll away. */
export function SiteFooter() {
  return (
    <footer className="page-shell mt-auto pt-10 text-sm text-faint">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-hairline/60 pt-5">
        <p className="m-0 flex items-center gap-3">
          <span
            aria-label="Players must be 18 or older"
            className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-table-red font-bold text-slate-50"
          >
            18+
          </span>
          <span>Play responsibly. Gambling should be fun, not a way to make money.</span>
        </p>
        <nav aria-label="Legal and help">
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            {links.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-muted no-underline transition-colors hover:text-slate-50"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
