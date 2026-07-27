import { Container, Graphics, Text } from 'pixi.js'
import { REEL_COUNT, SLOT_SYMBOLS } from '../model/symbols'

const COLORS = {
  cell: 0x0b1220,
  border: 0x334155,
} as const

export const CELL_WIDTH = 110
export const CELL_HEIGHT = 110
export const REEL_GAP = 12
export const SLOTS_VIEW_WIDTH = REEL_COUNT * CELL_WIDTH + (REEL_COUNT - 1) * REEL_GAP
export const SLOTS_VIEW_HEIGHT = CELL_HEIGHT

/* The symbol strip every reel scrolls through, in a fixed order. */
export const STRIP = SLOT_SYMBOLS.map((entry) => entry.symbol)

export interface Reel {
  strip: Container
  /* Continuous index into STRIP of the symbol currently in the window. */
  position: number
}

export interface SlotsScene {
  root: Container
  reels: Reel[]
}

export function createSlotsScene(initialSymbols: string[]): SlotsScene {
  const root = new Container()
  const reels: Reel[] = []

  for (let i = 0; i < REEL_COUNT; i++) {
    const cell = new Container()
    cell.x = i * (CELL_WIDTH + REEL_GAP)
    root.addChild(cell)

    const background = new Graphics()
    background.roundRect(0, 0, CELL_WIDTH, CELL_HEIGHT, 12)
    background.fill({ color: COLORS.cell })
    background.roundRect(0, 0, CELL_WIDTH, CELL_HEIGHT, 12)
    background.stroke({ color: COLORS.border, width: 2 })
    cell.addChild(background)

    const strip = new Container()
    // Two copies of the sequence so the wrap point is never visible mid-spin.
    for (let copy = 0; copy < 2; copy++) {
      STRIP.forEach((symbol, index) => {
        const text = new Text({
          text: symbol,
          style: { fontSize: 56, fontFamily: 'Segoe UI Emoji, sans-serif' },
        })
        text.anchor.set(0.5)
        text.x = CELL_WIDTH / 2
        text.y = (copy * STRIP.length + index) * CELL_HEIGHT + CELL_HEIGHT / 2
        strip.addChild(text)
      })
    }
    cell.addChild(strip)

    const mask = new Graphics()
    mask.roundRect(0, 0, CELL_WIDTH, CELL_HEIGHT, 12)
    mask.fill({ color: 0xffffff })
    cell.addChild(mask)
    strip.mask = mask

    const position = Math.max(0, STRIP.indexOf(initialSymbols[i] ?? STRIP[0]!))
    strip.y = -position * CELL_HEIGHT
    reels.push({ strip, position })
  }

  return { root, reels }
}
