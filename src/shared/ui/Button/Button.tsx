import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const baseClass =
  'rounded-control px-3.5 py-2.5 font-bold transition-[transform,opacity] duration-150 enabled:hover:-translate-y-px'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'flex-1 bg-gradient-to-b from-gold to-gold-deep text-gray-800',
  secondary: 'bg-slate-700 text-slate-50',
  danger: 'bg-red-800 text-white',
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(baseClass, variantClass[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}
