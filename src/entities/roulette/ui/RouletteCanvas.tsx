import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { WebGLRenderer } from 'three'
import { cn } from '@/shared/lib/cn'
import { spinDuration } from '@/shared/lib/reducedMotion'
import { createRenderLoop, type RenderLoop } from '@/shared/lib/renderLoop'
import { reportError } from '@/shared/lib/reportError'
import { afterPaint } from '@/shared/lib/schedule'
import { watchContextLoss } from '@/shared/lib/webglContext'
import { CanvasPlaceholder, CanvasUnavailable } from '@/shared/ui/CanvasPlaceholder'
import { animateSpin, SPIN_DURATION_MS } from '../lib/animateSpin'
import { configureRenderer, createWheelScene, type WheelScene } from '../lib/wheelScene'

export interface RouletteCanvasHandle {
  /** Resolves once the ball has settled in `pocketNumber`. */
  spinToPocket: (pocketNumber: number) => Promise<void>
}

interface RouletteCanvasProps {
  className?: string
}

/* Retina is wasted on a wheel this size and halves the frame rate on phones. */
const MAX_PIXEL_RATIO = 2

/* `lost` is a context the browser took back and may yet return; `failed` is final
 * until the player asks for another try. */
type SceneStatus = 'building' | 'ready' | 'lost' | 'failed'

export const RouletteCanvas = forwardRef<RouletteCanvasHandle, RouletteCanvasProps>(
  function RouletteCanvas({ className }, ref) {
    const hostRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<WheelScene | null>(null)
    const loopRef = useRef<RenderLoop | null>(null)
    const [status, setStatus] = useState<SceneStatus>('building')
    /* Bumped to throw the scene away and build it again from scratch. */
    const [generation, setGeneration] = useState(0)
    const ready = status === 'ready'

    const rebuild = useCallback(() => {
      setStatus('building')
      setGeneration((current) => current + 1)
    }, [])

    useImperativeHandle(ref, () => ({
      spinToPocket: async (pocketNumber: number) => {
        const scene = sceneRef.current
        const loop = loopRef.current
        if (!scene || !loop) return
        /* If the scene is torn down mid-spin, the round still has to settle. */
        await Promise.race([
          animateSpin(loop, scene, pocketNumber, spinDuration(SPIN_DURATION_MS)),
          loop.disposed,
        ])
      },
    }))

    useEffect(() => {
      const host = hostRef.current
      if (!host) return

      let cancelled = false
      /* Filled in as the wheel comes up, so unmounting midway tears down exactly
       * as much as was built. Run in reverse on cleanup. */
      const cleanups: Array<() => void> = []
      const teardown = () => {
        for (const cleanup of cleanups.splice(0).reverse()) cleanup()
      }

      /*
       * Turning 37 pockets into geometry and linking their shaders costs a
       * second or more, and doing it inline would hold back the paint of the
       * board around it. The page goes up first, the wheel follows.
       */
      const build = async () => {
        const renderer = new WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        })
        configureRenderer(renderer)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

        const scene = createWheelScene(renderer)
        const loop = createRenderLoop(() => renderer.render(scene.scene, scene.camera))
        cleanups.push(() => {
          loop.dispose()
          scene.dispose()
          renderer.dispose()
        })

        const resize = () => {
          const size = host.clientWidth
          if (size === 0) return
          renderer.setSize(size, size, false)
          scene.camera.aspect = 1
          scene.camera.updateProjectionMatrix()
          loop.requestRender()
        }

        resize()

        /* Where most of the wait goes. Browsers with parallel shader compilation
         * link off-thread here, so the placeholder keeps animating meanwhile. */
        await renderer.compileAsync(scene.scene, scene.camera)
        if (cancelled) return

        renderer.domElement.setAttribute('role', 'img')
        renderer.domElement.setAttribute('aria-label', 'Roulette wheel')
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

      /* No WebGL at all, or a driver that fails to link a shader: the table
       * still plays without the wheel, so this is a fallback, not a crash. */
      const cancelBuild = afterPaint(() => {
        build().catch((error: unknown) => {
          if (cancelled) return
          reportError(error, { scene: 'roulette' })
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
      <div className={cn('relative aspect-square w-full max-w-[44rem]', className)}>
        <div
          ref={hostRef}
          aria-busy={!ready}
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-300 motion-reduce:transition-none',
            '[&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full',
            ready && 'opacity-100',
          )}
        />
        {status === 'building' && <CanvasPlaceholder shape="wheel" label="Setting up the wheel…" />}
        {status === 'lost' && <CanvasPlaceholder shape="wheel" label="Restoring the wheel…" />}
        {status === 'failed' && <CanvasUnavailable onRetry={rebuild} />}
      </div>
    )
  },
)
