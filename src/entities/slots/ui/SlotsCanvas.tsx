import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { WebGLRenderer } from 'three'
import { cn } from '@/shared/lib/cn'
import { spinDuration } from '@/shared/lib/reducedMotion'
import { createRenderLoop, type RenderLoop } from '@/shared/lib/renderLoop'
import { reportError } from '@/shared/lib/reportError'
import { afterPaint } from '@/shared/lib/schedule'
import { watchContextLoss } from '@/shared/lib/webglContext'
import { CanvasPlaceholder, CanvasUnavailable } from '@/shared/ui/CanvasPlaceholder'
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

/* `lost` is a context the browser took back and may yet return; `failed` is final
 * until the player asks for another try. */
type SceneStatus = 'building' | 'ready' | 'lost' | 'failed'

export const SlotsCanvas = forwardRef<SlotsCanvasHandle, SlotsCanvasProps>(function SlotsCanvas(
  { initialReels, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<SlotsScene | null>(null)
  const loopRef = useRef<RenderLoop | null>(null)
  const initialReelsRef = useRef(initialReels)
  /* Kept current so a scene rebuilt after a lost context shows the last result,
   * not the reels the machine opened with. */
  useEffect(() => {
    initialReelsRef.current = initialReels
  }, [initialReels])
  const [status, setStatus] = useState<SceneStatus>('building')
  /* Bumped to throw the scene away and build it again from scratch. */
  const [generation, setGeneration] = useState(0)
  const ready = status === 'ready'

  const rebuild = useCallback(() => {
    setStatus('building')
    setGeneration((current) => current + 1)
  }, [])

  useImperativeHandle(ref, () => ({
    spinToReels: async (symbols: string[], won: boolean) => {
      const scene = sceneRef.current
      const loop = loopRef.current
      if (!scene || !loop) return

      /* If the scene is torn down mid-spin, the spin still has to settle. */
      await Promise.race([
        animateReels(loop, scene, symbols, spinDuration(SLOTS_SPIN_DURATION_MS)),
        loop.disposed,
      ])
      if (won && sceneRef.current === scene) {
        await Promise.race([celebrateWin(loop, scene, getWinningLine(symbols)), loop.disposed])
      }
    },
  }))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    /* Filled in as the scene comes up, so unmounting midway tears down exactly
     * as much as was built. Run in reverse on cleanup. */
    const cleanups: Array<() => void> = []
    const teardown = () => {
      for (const cleanup of cleanups.splice(0).reverse()) cleanup()
    }

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

      cleanups.push(
        watchContextLoss(renderer.domElement, {
          onLost: () => setStatus('lost'),
          onRestored: rebuild,
          onGaveUp: () => {
            teardown()
            setStatus('failed')
          },
        }),
      )

      loop.requestRender()
      setStatus('ready')

      const observer = new ResizeObserver(resize)
      observer.observe(host)
      cleanups.push(() => observer.disconnect())
    }

    /* No WebGL at all, or a driver that fails to link a shader: the machine
     * still pays out without the reels, so this is a fallback, not a crash. */
    const cancelBuild = afterPaint(() => {
      build().catch((error: unknown) => {
        if (cancelled) return
        reportError(error, { scene: 'slots' })
        teardown()
        setStatus('failed')
      })
    })

    return () => {
      cancelled = true
      cancelBuild()
      teardown()
    }
  }, [generation, rebuild])

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
      {status === 'building' && <CanvasPlaceholder shape="cabinet" label="Warming up the reels…" />}
      {status === 'lost' && <CanvasPlaceholder shape="cabinet" label="Restoring the reels…" />}
      {status === 'failed' && <CanvasUnavailable onRetry={rebuild} />}
    </div>
  )
})
