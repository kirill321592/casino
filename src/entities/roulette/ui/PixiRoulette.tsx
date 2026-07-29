import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Application } from 'pixi.js'
import { cn } from '@/shared/lib/cn'
import { animateSpin, SPIN_DURATION_MS } from '../lib/animateSpin'
import { centerWheelScene, createWheelScene, WHEEL_SIZE, type WheelScene } from '../lib/createWheel'

export interface PixiRouletteHandle {
  spinToPocket: (pocketNumber: number) => Promise<void>
}

interface PixiRouletteProps {
  className?: string
}

export const PixiRoulette = forwardRef<PixiRouletteHandle, PixiRouletteProps>(function PixiRoulette(
  { className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const sceneRef = useRef<WheelScene | null>(null)

  useImperativeHandle(ref, () => ({
    spinToPocket: async (pocketNumber: number) => {
      const app = appRef.current
      const scene = sceneRef.current
      if (!app || !scene) return
      await animateSpin(app.ticker, scene, pocketNumber, SPIN_DURATION_MS)
    },
  }))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    const app = new Application()

    void (async () => {
      await app.init({
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (disposed) {
        app.destroy(true)
        return
      }

      host.appendChild(app.canvas)
      appRef.current = app

      const scene = createWheelScene()
      centerWheelScene(scene, WHEEL_SIZE)
      app.stage.addChild(scene.root)
      sceneRef.current = scene
    })()

    return () => {
      disposed = true
      appRef.current = null
      sceneRef.current = null
      if (app.renderer) {
        app.destroy(true, { children: true })
      }
      host.replaceChildren()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      className={cn(
        'aspect-square w-full [&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full',
        className,
      )}
      style={{ maxWidth: `${WHEEL_SIZE / 16}rem` }}
    />
  )
})
