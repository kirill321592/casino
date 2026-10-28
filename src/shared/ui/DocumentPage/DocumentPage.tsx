import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { routes } from '@/shared/config/routes'

interface DocumentPageProps {
  /** Also the tab title. */
  title: string
  /** One line under the heading: what this page is for, or when it last changed. */
  lede?: ReactNode
  children: ReactNode
}

/**
 * A page of reading — rules, terms, guidance. Narrow measure and plain headings,
 * so long text is comfortable; sections inside use `<DocumentSection>`.
 */
export function DocumentPage({ title, lede, children }: DocumentPageProps) {
  return (
    <div className="page-shell w-full">
      <title>{`${title} · European Casino`}</title>
      <article className="mx-auto max-w-[44rem]">
        <Link
          to={routes.lobby}
          className="mb-4 inline-block text-sm text-muted no-underline transition-colors hover:text-slate-50"
        >
          ← Back to the casino
        </Link>
        <h1 className="m-0 text-3xl text-balance sm:text-[2.5rem]">{title}</h1>
        {lede && <p className="mt-2 text-muted text-pretty">{lede}</p>}
        <div className="mt-8 flex flex-col gap-8">{children}</div>
      </article>
    </div>
  )
}

export function DocumentSection({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="card scroll-mt-6 p-5 sm:p-6"
    >
      <h2 id={id ? `${id}-title` : undefined} className="m-0 text-xl text-balance">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-slate-300 text-pretty [&_p]:m-0">
        {children}
      </div>
    </section>
  )
}
