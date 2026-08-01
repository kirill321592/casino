import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/shared/lib/cn'

/* A rejected field is outlined in red — the message beside it is not the only tell. */
const baseClass =
  'w-full rounded-control border border-slate-400/25 bg-ink/70 px-3 py-2 text-slate-50 outline-none transition-colors placeholder:text-faint focus:border-gold/60 disabled:opacity-55 aria-[invalid=true]:border-table-red'

/* Takes a ref so form libraries can register the field directly. */
export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return <input className={cn(baseClass, className)} {...props} />
}
