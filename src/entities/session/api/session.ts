import { getJson, postJson } from '@/shared/api/http'
import type { AuthUser, Credentials } from '../model/types'

/*
 * The JWT never reaches this file. It travels as an httpOnly cookie the browser
 * attaches on its own, which is why every call here goes out with credentials
 * and why there is nothing to store.
 */

export function signUp(credentials: Credentials): Promise<AuthUser> {
  return postJson<AuthUser>('/auth/signup', credentials)
}

export function signIn(credentials: Credentials): Promise<AuthUser> {
  return postJson<AuthUser>('/auth/login', credentials)
}

export function signOut(): Promise<void> {
  return postJson<void>('/auth/logout', {})
}

/** Restores the session on reload, and is the balance every game starts from. */
export function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  return getJson<AuthUser>('/auth/me', signal)
}
