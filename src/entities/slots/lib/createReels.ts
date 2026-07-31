import { Container, Graphics, Text } from 'pixi.js'
import { REEL_COUNT, SLOT_SYMBOLS } from '../model/symbols'

const COLORS = {
  frame: 0x1c1408,
  frameEdge: 0xc9a227,
  frameInner: 0x05080f,
  window: 0x0b1220,
  windowEdge: 0x334155,
  gold: 0xfbbf24,
  shade: 0x000000,
} as const

export const VISIBLE_ROWS = 3
export const CELL_WIDTH = 128
export const CELL_HEIGHT = 112
export const REEL_GAP = 10

const FRAME_PAD = 20
/* Row index the payout is read from — the middle one. */
const PAYLINE_ROW = (VISIBLE_ROWS - 1) / 2
/* Copies of the strip stacked back to back, so the window never runs off an end. */
const STRIP_COPIES = 3
const SHADE_STEPS = 6

export const REEL_WINDOW_HEIGHT = VISIBLE_ROWS * CELL_HEIGHT
export const SLOTS_VIEW_WIDTH =
  2 * FRAME_PAD + REEL_COUNT * CELL_WIDTH + (REEL_COUNT - 1) * REEL_GAP
export const SLOTS_VIEW_HEIGHT = 2 * FRAME_PAD + REEL_WINDOW_HEIGHT

/* The symbol strip every reel scrolls through, in a fixed order. */
export const STRIP = SLOT_SYMBOLS.map((entry) => entry.symbol)

export interface Reel {
  strip: Container
  symbols: Text[]
  /* Continuous index into STRIP of the symbol sitting on the payline. */
  position: number
  /* Gold ring that lights up while this reel is teasing a win. */
  glow: Graphics
  /* Halo behind the payline symbol when it is part of a winning line. */
  winGlow: Graphics
}

export interface SlotsScene {
  root: Container
  reels: Reel[]
  payline: Graphics
}

export function createSlotsScene(initialSymbols: string[]): SlotsScene {
  const root = new Container()
  const reels: Reel[] = []

  drawCabinet(root)

  for (let i = 0; i < REEL_COUNT; i++) {
    const { container, reel } = createReel()
    container.x = FRAME_PAD + i * (CELL_WIDTH + REEL_GAP)
    container.y = FRAME_PAD
    root.addChild(container)

    setReelPosition(reel, Math.max(0, STRIP.indexOf(initialSymbols[i] ?? STRIP[0]!)))
    reels.push(reel)
  }

  return { root, reels, payline: drawPayline(root) }
}

/** Scrolls a reel so `position` (a continuous index into STRIP) sits on the payline. */
export function setReelPosition(reel: Reel, position: number): void {
  reel.position = position
  reel.strip.y = CELL_HEIGHT * (PAYLINE_ROW - STRIP.length - position)
}

/**
 * Fakes motion blur from how fast the reel is travelling: symbols smear
 * vertically and thin out, then snap back to crisp when the reel settles.
 */
export function setReelBlur(reel: Reel, rowsPerFrame: number): void {
  const intensity = Math.min(rowsPerFrame, 1.2)
  const stretch = 1 + intensity * 0.9
  const alpha = 1 - intensity * 0.45

  for (const symbol of reel.symbols) {
    symbol.scale.set(1, stretch)
    symbol.alpha = alpha
  }
}

/** The Text currently parked on the payline, so a win can be pulsed in place. */
export function getPaylineSymbol(reel: Reel): Text | undefined {
  const index = STRIP.length + (Math.round(reel.position) % STRIP.length)
  return reel.symbols[index]
}

function createReel(): { container: Container; reel: Reel } {
  const container = new Container()

  const background = new Graphics()
  background.roundRect(0, 0, CELL_WIDTH, REEL_WINDOW_HEIGHT, 10)
  background.fill({ color: COLORS.window })
  container.addChild(background)

  const strip = new Container()
  const symbols: Text[] = []
  for (let copy = 0; copy < STRIP_COPIES; copy++) {
    STRIP.forEach((symbol, index) => {
      const text = new Text({
        text: symbol,
        style: {
          fontSize: 62,
          fontFamily: 'Segoe UI Emoji, sans-serif',
          dropShadow: { color: 0x000000, alpha: 0.55, blur: 4, distance: 3, angle: Math.PI / 2 },
        },
      })
      text.anchor.set(0.5)
      text.x = CELL_WIDTH / 2
      text.y = (copy * STRIP.length + index) * CELL_HEIGHT + CELL_HEIGHT / 2
      strip.addChild(text)
      symbols.push(text)
    })
  }
  container.addChild(strip)

  const winGlow = new Graphics()
  winGlow.roundRect(4, PAYLINE_ROW * CELL_HEIGHT + 4, CELL_WIDTH - 8, CELL_HEIGHT - 8, 10)
  winGlow.fill({ color: COLORS.gold })
  winGlow.blendMode = 'add'
  winGlow.alpha = 0
  container.addChild(winGlow)

  drawWindowShading(container)

  const glow = new Graphics()
  glow.roundRect(1, 1, CELL_WIDTH - 2, REEL_WINDOW_HEIGHT - 2, 10)
  glow.stroke({ color: COLORS.gold, width: 3 })
  glow.alpha = 0
  container.addChild(glow)

  const edge = new Graphics()
  edge.roundRect(0, 0, CELL_WIDTH, REEL_WINDOW_HEIGHT, 10)
  edge.stroke({ color: COLORS.windowEdge, width: 2 })
  container.addChild(edge)

  const mask = new Graphics()
  mask.roundRect(0, 0, CELL_WIDTH, REEL_WINDOW_HEIGHT, 10)
  mask.fill({ color: 0xffffff })
  container.addChild(mask)
  strip.mask = mask

  return { container, reel: { strip, symbols, position: 0, glow, winGlow } }
}

/* Curved-drum illusion: the window darkens towards its top and bottom edges. */
function drawWindowShading(container: Container): void {
  const bandHeight = (CELL_HEIGHT * 0.95) / SHADE_STEPS

  for (let step = 0; step < SHADE_STEPS; step++) {
    const alpha = 0.6 * (1 - step / SHADE_STEPS) ** 1.6
    const shade = new Graphics()
    shade.rect(0, step * bandHeight, CELL_WIDTH, bandHeight + 1)
    shade.rect(0, REEL_WINDOW_HEIGHT - (step + 1) * bandHeight - 1, CELL_WIDTH, bandHeight + 1)
    shade.fill({ color: COLORS.shade, alpha })
    container.addChild(shade)
  }
}

function drawCabinet(root: Container): void {
  const frame = new Graphics()
  frame.roundRect(0, 0, SLOTS_VIEW_WIDTH, SLOTS_VIEW_HEIGHT, 24)
  frame.fill({ color: COLORS.frame })
  frame.roundRect(1, 1, SLOTS_VIEW_WIDTH - 2, SLOTS_VIEW_HEIGHT - 2, 24)
  frame.stroke({ color: COLORS.frameEdge, width: 2, alpha: 0.75 })
  root.addChild(frame)

  const inner = new Graphics()
  inner.roundRect(
    FRAME_PAD - 6,
    FRAME_PAD - 6,
    SLOTS_VIEW_WIDTH - 2 * (FRAME_PAD - 6),
    SLOTS_VIEW_HEIGHT - 2 * (FRAME_PAD - 6),
    14,
  )
  inner.fill({ color: COLORS.frameInner })
  inner.stroke({ color: COLORS.frameEdge, width: 1, alpha: 0.35 })
  root.addChild(inner)
}

/* Marks the row that pays: a hairline across the reels with an arrow at each end. */
function drawPayline(root: Container): Graphics {
  const y = FRAME_PAD + PAYLINE_ROW * CELL_HEIGHT + CELL_HEIGHT / 2
  const payline = new Graphics()

  payline.moveTo(FRAME_PAD, y)
  payline.lineTo(SLOTS_VIEW_WIDTH - FRAME_PAD, y)
  payline.stroke({ color: COLORS.gold, width: 2, alpha: 0.28 })

  for (const side of [-1, 1]) {
    const tip = side < 0 ? FRAME_PAD - 3 : SLOTS_VIEW_WIDTH - FRAME_PAD + 3
    payline.moveTo(tip, y)
    payline.lineTo(tip - side * 11, y - 8)
    payline.lineTo(tip - side * 11, y + 8)
    payline.closePath()
  }
  payline.fill({ color: COLORS.gold })

  root.addChild(payline)
  return payline
}
