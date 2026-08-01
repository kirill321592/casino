import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onUnauthorized } from '@/shared/api/unauthorized'
import * as api from '../api/session'
import { SessionContext, type SessionStatus } from './sessionContext'
import type { AuthUser, Credentials } from './types'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<SessionStatus>('loading')

  // The cookie survives a reload; this is what turns it back into an account.
  useEffect(() => {
    const controller = new AbortController()

    api
      .fetchCurrentUser(controller.signal)
      .then(setUser)
      // A rejection here just means nobody is signed in — the sign-in screen says so.
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setStatus('ready')
      })

    return () => controller.abort()
  }, [])

  /* An expired or revoked token ends the session wherever it is noticed. */
  useEffect(() => onUnauthorized(() => setUser(null)), [])

  const signIn = useCallback(async (credentials: Credentials) => {
    setUser(await api.signIn(credentials))
  }, [])

  const signUp = useCallback(async (credentials: Credentials) => {
    setUser(await api.signUp(credentials))
  }, [])

  const signOut = useCallback(() => {
    // Dropping the account locally is the part the player can see; clearing the
    // cookie is the server's job and not worth blocking the screen on.
    setUser(null)
    void api.signOut().catch(() => undefined)
  }, [])

  const setBalance = useCallback((balance: number) => {
    setUser((current) =>
      current === null || current.balance === balance ? current : { ...current, balance },
    )
  }, [])

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut, setBalance }),
    [user, status, signIn, signUp, signOut, setBalance],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
