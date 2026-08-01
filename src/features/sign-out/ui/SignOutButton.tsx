import { useSession } from '@/entities/session/model/useSession'

export function SignOutButton() {
  const { user, signOut } = useSession()
  if (!user) return null

  return (
    <div className="text-right">
      <span className="block text-sm text-muted">
        Signed in as <strong className="text-slate-50">{user.username}</strong>
      </span>
      <button
        type="button"
        onClick={signOut}
        className="text-sm text-muted transition-colors hover:text-slate-50"
      >
        Sign out
      </button>
    </div>
  )
}
