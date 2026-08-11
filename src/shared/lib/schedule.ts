/*
 * Getting heavy work out of the way of a paint.
 *
 * React flushes passive effects before the browser paints, so building a WebGL
 * scene inside a `useEffect` holds back the whole page rather than just the
 * panel it belongs to — the player watches a blank screen for as long as the
 * scene takes. These two put that work behind a paint instead.
 */

/** Runs `task` once the browser has painted. Returns a cancel function. */
export function afterPaint(task: () => void): () => void {
  let inner: number | null = null

  /* The first frame's callback still runs before that frame is painted; it is
   * the one queued from inside it that lands on the other side. */
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(() => {
      inner = null
      task()
    })
  })

  return () => {
    cancelAnimationFrame(outer)
    if (inner !== null) cancelAnimationFrame(inner)
  }
}

/** Runs `task` on an idle main thread, or by `timeoutMs` at the latest. */
export function whenIdle(task: () => void, timeoutMs = 1000): () => void {
  if (typeof requestIdleCallback !== 'function') {
    const timer = setTimeout(task, timeoutMs)
    return () => clearTimeout(timer)
  }

  const handle = requestIdleCallback(task, { timeout: timeoutMs })
  return () => cancelIdleCallback(handle)
}
