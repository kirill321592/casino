import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { WebGLRenderer } from 'three'
import { cn } from '@/shared/lib/cn'
import { spinDuration } from '@/shared/lib/reducedMotion'
import { createRenderLoop, type RenderLoop } from '@/shared/lib/renderLoop'
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

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    configureRenderer(renderer)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

    const scene = createSlotsScene(renderer, initialReelsRef.current)
    const loop = createRenderLoop(() => renderer.render(scene.scene, scene.camera))

    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute('aria-label', 'Slot machine reels')
    host.appendChild(renderer.domElement)

    sceneRef.current = scene
    loopRef.current = loop

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
        'w-full max-w-[45rem] [&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full',
        className,
      )}
      style={{ aspectRatio: `${SLOTS_VIEW_WIDTH} / ${SLOTS_VIEW_HEIGHT}` }}
    />
  )
})
