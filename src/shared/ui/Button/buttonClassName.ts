import { cn } from '@/shared/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

const baseClass =
  'rounded-control px-2.5 py-1.5 font-bold transition-[transform,opacity] duration-150 enabled:hover:-translate-y-px'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'flex-1 bg-gradient-to-b from-gold to-gold-deep text-gray-800',
  secondary: 'bg-slate-700 text-slate-50',
  danger: 'bg-red-800 text-white',
}

/** The button look, for a link that has to wear it. */
export function buttonClassName(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(baseClass, variantClass[variant], className)
}
