import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { WebGLRenderer } from 'three'
import { cn } from '@/shared/lib/cn'
import { spinDuration } from '@/shared/lib/reducedMotion'
import { createRenderLoop, type RenderLoop } from '@/shared/lib/renderLoop'
import { afterPaint } from '@/shared/lib/schedule'
import { CanvasPlaceholder } from '@/shared/ui/CanvasPlaceholder'
import { animateReels, celebrateWin, SLOTS_SPIN_DURATION_MS } from '../lib/animateReels'
import {
  configureRenderer,
  createSlotsScene,
  SLOTS_VIEW_HEIGHT,
  SLOTS_VIEW_WIDTH,
  type SlotsScene,
} from '../lib/reelScene'
import { getWinningLine } from '../model/winningLine'

export interface SlotsCanvasHandle {
  /* Resolves once the reels have stopped and any winning line has flashed. */
  spinToReels: (symbols: string[], won: boolean) => Promise<void>
}

interface SlotsCanvasProps {
  initialReels: string[]
  className?: string
}

const MAX_PIXEL_RATIO = 2

export const SlotsCanvas = forwardRef<SlotsCanvasHandle, SlotsCanvasProps>(function SlotsCanvas(
  { initialReels, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<SlotsScene | null>(null)
  const loopRef = useRef<RenderLoop | null>(null)
  const initialReelsRef = useRef(initialReels)
  const [ready, setReady] = useState(false)

  useImperativeHandle(ref, () => ({
    spinToReels: async (symbols: string[], won: boolean) => {
      const scene = sceneRef.current
      const loop = loopRef.current
      if (!scene || !loop) return

      await animateReels(loop, scene, symbols, spinDuration(SLOTS_SPIN_DURATION_MS))
      if (won && sceneRef.current) await celebrateWin(loop, scene, getWinningLine(symbols))
    },
  }))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    /* Filled in as the scene comes up, so unmounting midway tears down exactly
     * as much as was built. Run in reverse on cleanup. */
    const cleanups: Array<() => void> = []

    /*
     * Building the cabinet and linking its shaders costs a second or more, and
     * doing it inline would hold back the paint of the page around it. So the
     * page goes up first, this follows, and the placeholder covers the gap.
     */
    const build = async () => {
      const renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      configureRenderer(renderer)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

      const scene = createSlotsScene(renderer, initialReelsRef.current)
      const loop = createRenderLoop(() => renderer.render(scene.scene, scene.camera))
      cleanups.push(() => {
        loop.dispose()
        scene.dispose()
        renderer.dispose()
      })

      const resize = () => {
        const width = host.clientWidth
        if (width === 0) return
        const height = (width * SLOTS_VIEW_HEIGHT) / SLOTS_VIEW_WIDTH

        renderer.setSize(width, height, false)
        scene.camera.aspect = width / height
        scene.camera.updateProjectionMatrix()
        loop.requestRender()
      }

      resize()

      /* Where most of the wait goes. Browsers with parallel shader compilation
       * link off-thread here, so the placeholder keeps animating meanwhile. */
      await renderer.compileAsync(scene.scene, scene.camera)
      if (cancelled) return

      renderer.domElement.setAttribute('role', 'img')
      renderer.domElement.setAttribute('aria-label', 'Slot machine reels')
      host.appendChild(renderer.domElement)

      sceneRef.current = scene
      loopRef.current = loop
      cleanups.push(() => {
        sceneRef.current = null
        loopRef.current = null
        host.replaceChildren()
      })

      loop.requestRender()
      setReady(true)

      const observer = new ResizeObserver(resize)
      observer.observe(host)
      cleanups.push(() => observer.disconnect())
    }

    const cancelBuild = afterPaint(() => void build())

    return () => {
      cancelled = true
      cancelBuild()
      for (const cleanup of cleanups.reverse()) cleanup()
    }
  }, [])

  return (
    <div
      className={cn('relative w-full max-w-[45rem]', className)}
      style={{ aspectRatio: `${SLOTS_VIEW_WIDTH} / ${SLOTS_VIEW_HEIGHT}` }}
    >
      <div
        ref={hostRef}
        aria-busy={!ready}
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 motion-reduce:transition-none',
          '[&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full',
          ready && 'opacity-100',
        )}
      />
      {!ready && <CanvasPlaceholder shape="cabinet" label="Warming up the reels…" />}
    </div>
  )
})
