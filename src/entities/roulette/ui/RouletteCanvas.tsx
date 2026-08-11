import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { WebGLRenderer } from 'three'
import { cn } from '@/shared/lib/cn'
import { spinDuration } from '@/shared/lib/reducedMotion'
import { createRenderLoop, type RenderLoop } from '@/shared/lib/renderLoop'
import { afterPaint } from '@/shared/lib/schedule'
import { CanvasPlaceholder } from '@/shared/ui/CanvasPlaceholder'
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

export const RouletteCanvas = forwardRef<RouletteCanvasHandle, RouletteCanvasProps>(
  function RouletteCanvas({ className }, ref) {
    const hostRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<WheelScene | null>(null)
    const loopRef = useRef<RenderLoop | null>(null)
    const [ready, setReady] = useState(false)

    useImperativeHandle(ref, () => ({
      spinToPocket: async (pocketNumber: number) => {
        const scene = sceneRef.current
        const loop = loopRef.current
        if (!scene || !loop) return
        await animateSpin(loop, scene, pocketNumber, spinDuration(SPIN_DURATION_MS))
      },
    }))

    useEffect(() => {
      const host = hostRef.current
      if (!host) return

      let cancelled = false
      /* Filled in as the wheel comes up, so unmounting midway tears down exactly
       * as much as was built. Run in reverse on cleanup. */
      const cleanups: Array<() => void> = []

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
        {!ready && <CanvasPlaceholder shape="wheel" label="Setting up the wheel…" />}
      </div>
    )
  },
)
