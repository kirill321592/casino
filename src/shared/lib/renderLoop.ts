/**
 * Drives WebGL frames. Replaces Pixi's ticker, with one difference that matters
 * for battery: the rAF loop only runs while something is actually animating.
 * A still wheel costs nothing, and `requestRender` covers one-off redraws
 * (first paint, resize).
 */
export interface RenderLoop {
  /** Runs `fn` every frame until removed. Starts the loop if it was idle. */
  add: (fn: (deltaMs: number) => void) => void
  remove: (fn: (deltaMs: number) => void) => void
  /** Draws a single frame without starting the loop. */
  requestRender: () => void
  dispose: () => void
}

export function createRenderLoop(render: () => void): RenderLoop {
  const callbacks = new Set<(deltaMs: number) => void>()
  let frame: number | null = null
  let pendingFrame: number | null = null
  let lastTime = 0
  let disposed = false

  const tick = (now: number) => {
    const deltaMs = lastTime === 0 ? 16.67 : now - lastTime
    lastTime = now

    for (const callback of [...callbacks]) callback(deltaMs)
    render()

    frame = callbacks.size > 0 ? requestAnimationFrame(tick) : null
    if (frame === null) lastTime = 0
  }

  return {
    add(fn) {
      if (disposed) return
      callbacks.add(fn)
      if (frame === null) frame = requestAnimationFrame(tick)
    },
    remove(fn) {
      callbacks.delete(fn)
    },
    requestRender() {
      if (disposed || frame !== null || pendingFrame !== null) return
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = null
        render()
      })
    },
    dispose() {
      disposed = true
      callbacks.clear()
      if (frame !== null) cancelAnimationFrame(frame)
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame)
      frame = null
      pendingFrame = null
    },
  }
}
