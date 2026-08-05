import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { WebGLRenderer } from 'three'
import { cn } from '@/shared/lib/cn'
import { spinDuration } from '@/shared/lib/reducedMotion'
import { createRenderLoop, type RenderLoop } from '@/shared/lib/renderLoop'
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

      const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      configureRenderer(renderer)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

      const scene = createWheelScene(renderer)
      const loop = createRenderLoop(() => renderer.render(scene.scene, scene.camera))

      renderer.domElement.setAttribute('role', 'img')
      renderer.domElement.setAttribute('aria-label', 'Roulette wheel')
      host.appendChild(renderer.domElement)

      sceneRef.current = scene
      loopRef.current = loop

      const resize = () => {
        const size = host.clientWidth
        if (size === 0) return
        renderer.setSize(size, size, false)
        scene.camera.aspect = 1
        scene.camera.updateProjectionMatrix()
        loop.requestRender()
      }

      resize()
      const observer = new ResizeObserver(resize)
      observer.observe(host)

      return () => {
        observer.disconnect()
        loop.dispose()
        scene.dispose()
        renderer.dispose()
        sceneRef.current = null
        loopRef.current = null
        host.replaceChildren()
      }
    }, [])

    return (
      <div
        ref={hostRef}
        className={cn(
          'aspect-square w-full max-w-[44rem] [&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full',
          className,
        )}
      />
    )
  },
)
