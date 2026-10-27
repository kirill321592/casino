/*
 * A WebGL context is not the page's to keep. Mobile browsers reclaim it when the
 * tab is backgrounded or memory runs short, desktop ones on a GPU reset or when
 * too many contexts are open — and a canvas whose context is gone just stops
 * drawing, silently, until something rebuilds it.
 */

/* Long enough for a GPU reset to finish; a context evicted outright never comes back. */
const RESTORE_TIMEOUT_MS = 4000

interface ContextLossHandlers {
  onLost: () => void
  /** The browser handed the context back; the scene has to be rebuilt to use it. */
  onRestored: () => void
  /** No restore arrived in time. Treat the canvas as dead. */
  onGaveUp: () => void
}

/** Watches `canvas` for its context going away. Returns the teardown. */
export function watchContextLoss(
  canvas: HTMLCanvasElement,
  { onLost, onRestored, onGaveUp }: ContextLossHandlers,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  /* three.js calls preventDefault on this itself, which is what lets the browser
   * restore the context at all. */
  const lost = () => {
    onLost()
    clearTimer()
    timer = setTimeout(onGaveUp, RESTORE_TIMEOUT_MS)
  }

  const restored = () => {
    clearTimer()
    onRestored()
  }

  canvas.addEventListener('webglcontextlost', lost)
  canvas.addEventListener('webglcontextrestored', restored)

  return () => {
    clearTimer()
    canvas.removeEventListener('webglcontextlost', lost)
    canvas.removeEventListener('webglcontextrestored', restored)
  }
}
