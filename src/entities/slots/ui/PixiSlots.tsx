import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Application } from 'pixi.js'
import { cn } from '@/shared/lib/cn'
import { animateReels, celebrateWin, SLOTS_SPIN_DURATION_MS } from '../lib/animateReels'
import {
  createSlotsScene,
  SLOTS_VIEW_HEIGHT,
  SLOTS_VIEW_WIDTH,
  type SlotsScene,
} from '../lib/createReels'
import { getWinningLine } from '../model/winningLine'

export interface PixiSlotsHandle {
  /* Resolves once the reels have stopped and any winning line has flashed. */
  spinToReels: (symbols: string[], won: boolean) => Promise<void>
}

interface PixiSlotsProps {
  initialReels: string[]
  className?: string
}

export const PixiSlots = forwardRef<PixiSlotsHandle, PixiSlotsProps>(function PixiSlots(
  { initialReels, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const sceneRef = useRef<SlotsScene | null>(null)
  const initialReelsRef = useRef(initialReels)

  useImperativeHandle(ref, () => ({
    spinToReels: async (symbols: string[], won: boolean) => {
      const app = appRef.current
      const scene = sceneRef.current
      if (!app || !scene) return
      await animateReels(app.ticker, scene, symbols, SLOTS_SPIN_DURATION_MS)
      if (won && appRef.current) await celebrateWin(app.ticker, scene, getWinningLine(symbols))
    },
  }))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    const app = new Application()

    void (async () => {
      await app.init({
        width: SLOTS_VIEW_WIDTH,
        height: SLOTS_VIEW_HEIGHT,
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

      const scene = createSlotsScene(initialReelsRef.current)
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
      className={cn('w-full [&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full', className)}
      style={{
        maxWidth: `${SLOTS_VIEW_WIDTH / 16}rem`,
        aspectRatio: `${SLOTS_VIEW_WIDTH} / ${SLOTS_VIEW_HEIGHT}`,
      }}
    />
  )
})
