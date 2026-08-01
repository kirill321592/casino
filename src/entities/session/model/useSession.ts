import { useContext } from 'react'
import { SessionContext, type SessionContextValue } from './sessionContext'
import type { AuthUser } from './types'

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }

  return context
}

/**
 * For everything behind the sign-in gate: the account is guaranteed there, so
 * callers get an `AuthUser` instead of a nullable one they would have to narrow.
 */
export function useAuthUser(): AuthUser {
  const { user } = useSession()
  if (!user) {
    throw new Error('useAuthUser must be used inside a signed-in screen')
  }

  return user
}
