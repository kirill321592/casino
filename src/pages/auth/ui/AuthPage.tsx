import { AuthForm } from '@/features/auth/ui/AuthForm'

export function AuthPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col items-center justify-center">
      <header className="mb-8 text-center">
        <span className="text-5xl" aria-hidden>
          🎰
        </span>
        <h1 className="mt-3 mb-0 text-3xl sm:text-[2.5rem]">Casino Lobby</h1>
        <p className="mt-2 text-muted">Sign in to take a seat at the table.</p>
      </header>

      <AuthForm />
    </div>
  )
}
