import { createContext } from 'react'
import type { AuthUser, Credentials } from './types'

export type SessionStatus = 'loading' | 'ready'

export interface SessionContextValue {
  /** Null until someone signs in, and again the moment their token stops working. */
  user: AuthUser | null
  /** `loading` while the stored cookie is being exchanged for an account. */
  status: SessionStatus
  signIn: (credentials: Credentials) => Promise<void>
  signUp: (credentials: Credentials) => Promise<void>
  signOut: () => void
  /** Games call this with the balance the server reported, never one they computed. */
  setBalance: (balance: number) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)
