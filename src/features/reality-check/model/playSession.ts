/*
 * When this sitting started, and with what balance — the two numbers a reality
 * check reports against. Kept in sessionStorage so a reload does not reset the
 * clock, while a new tab or a new sign-in does.
 */

const KEY = 'casino:play-session'

export interface PlaySession {
  userId: string
  startedAt: number
  openingBalance: number
}

/** The current account's sitting, started now if there is none on record. */
export function resumePlaySession(userId: string, balance: number, now = Date.now()): PlaySession {
  const stored = read()
  if (stored?.userId === userId) return stored

  const session = { userId, startedAt: now, openingBalance: balance }
  write(session)
  return session
}

/** When the next reminder falls due: the next whole interval since the sitting began. */
export function nextCheckAt(startedAt: number, intervalMs: number, now = Date.now()): number {
  const elapsedIntervals = Math.floor((now - startedAt) / intervalMs)
  return startedAt + (elapsedIntervals + 1) * intervalMs
}

/* Storage can be missing or throw (private mode, blocked site data); the check still works for this page's lifetime. */
function read(): PlaySession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PlaySession) : null
  } catch {
    return null
  }
}

function write(session: PlaySession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // See `read`.
  }
}
