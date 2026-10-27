/**
 * The one place errors leave the app. Today that is the console; an error
 * tracker (Sentry and the like) plugs in here without touching any caller.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error(error, ...(context ? [context] : []))
}
