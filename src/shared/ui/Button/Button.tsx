import type { ComponentPropsWithRef, ReactNode } from 'react'
import { buttonClassName, type ButtonVariant } from './buttonClassName'

/* Takes a ref, so a dialog can put focus on the button it means. */
interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button type="button" className={buttonClassName(variant, className)} {...props}>
      {children}
    </button>
  )
}
