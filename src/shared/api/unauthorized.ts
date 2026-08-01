type Listener = () => void

const listeners = new Set<Listener>()

/**
 * A 401 can arrive at any moment — a token expires, or the server restarts and
 * forgets every account. Rather than let each caller invent its own recovery,
 * the session listens here once and drops the player back to the sign-in screen.
 */
export function onUnauthorized(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyUnauthorized(): void {
  for (const listener of listeners) listener()
}
