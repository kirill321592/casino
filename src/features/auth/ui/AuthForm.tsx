import { useState } from 'react'
import { PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH } from '@/entities/session/model/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useAuthForm, type AuthMode } from '../model/useAuthForm'

const copy = {
  login: {
    title: 'Welcome back',
    blurb: 'Sign in to pick up your balance where you left it.',
    action: 'Sign in',
    prompt: 'New here?',
    swap: 'Create an account',
  },
  signup: {
    title: 'Create an account',
    blurb: 'Every new player starts with a balance on the house.',
    action: 'Sign up',
    prompt: 'Already playing?',
    swap: 'Sign in',
  },
} as const

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login')
  const { errors, pending, submit, reset, username, password } = useAuthForm(mode)
  const { title, blurb, action, prompt, swap } = copy[mode]

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    // The other mode starts clean — its fields and whatever it was told are gone.
    reset()
  }

  return (
    /* noValidate: the browser's own bubbles would pre-empt these messages. */
    <form onSubmit={submit} noValidate className="card w-full max-w-[24rem] p-6">
      <h2 className="m-0 text-xl">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-muted">{blurb}</p>

      <label className="panel-label" htmlFor="auth-username">
        Username
      </label>
      <Input
        {...username}
        id="auth-username"
        autoComplete="username"
        autoFocus
        required
        maxLength={USERNAME_MAX_LENGTH}
        disabled={pending}
        aria-invalid={Boolean(errors.username)}
        aria-describedby={errors.username ? 'auth-username-error' : undefined}
      />
      <FieldError id="auth-username-error" message={errors.username?.message} />

      <label className="panel-label mt-4" htmlFor="auth-password">
        Password
      </label>
      <Input
        {...password}
        id="auth-password"
        type="password"
        // Tells the password manager to offer a new password rather than an old one.
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        required
        disabled={pending}
        aria-invalid={Boolean(errors.password)}
        aria-describedby={errors.password ? 'auth-password-error' : undefined}
      />
      <FieldError id="auth-password-error" message={errors.password?.message} />
      {mode === 'signup' && !errors.password && (
        <p className="mt-2 mb-0 text-xs text-faint">At least {PASSWORD_MIN_LENGTH} characters.</p>
      )}

      {errors.root && (
        <p className="mt-4 mb-0 text-sm text-table-red" role="alert">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-5 w-full">
        {pending ? 'Please wait…' : action}
      </Button>

      <p className="mt-4 mb-0 text-center text-sm text-muted">
        {prompt}{' '}
        <button
          type="button"
          onClick={switchMode}
          disabled={pending}
          className="font-bold text-gold transition-colors hover:text-gold-soft"
        >
          {swap}
        </button>
      </p>
    </form>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null

  return (
    <p id={id} role="alert" className="mt-2 mb-0 text-sm text-table-red">
      {message}
    </p>
  )
}
