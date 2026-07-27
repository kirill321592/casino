import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compose Tailwind class names conditionally, with later classes winning
 * conflicts (e.g. `cn('px-2', 'px-4')` → `px-4`). This keeps component
 * variants and `className` overrides predictable as the UI grows.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
