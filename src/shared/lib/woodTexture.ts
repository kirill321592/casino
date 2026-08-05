/**
 * Procedural wood grain, drawn to a canvas so nothing has to be downloaded.
 *
 * Grain runs along the canvas's Y axis. On a lathed or cylindrical mesh that is
 * the profile direction, so the rings come out following the turned surface the
 * way they do on a real wheel.
 *
 * The noise tiles exactly across X — the U axis wraps the whole way round the
 * wheel, and any discontinuity would show as a seam running down it.
 */
export interface WoodTextureOptions {
  width?: number
  height?: number
  /** Growth rings across the height of the texture. */
  rings?: number
  /** Darkest and lightest points of the grain, as [r, g, b]. */
  dark?: readonly [number, number, number]
  light?: readonly [number, number, number]
  seed?: number
}

/*
 * Deliberately small. Both axes carry only low-frequency detail — a handful of
 * noise cells around the circumference and a few rings up the profile — and the
 * grain sits under a clearcoat with anisotropic filtering, so spending more
 * pixels here buys nothing but a longer stall on the first frame.
 */
const DEFAULTS = {
  width: 192,
  height: 256,
  /*
   * Few and wide. A lathed profile compresses V towards the rim, so a high ring
   * count stacks up there and the bowl reads as corrugated rather than turned.
   */
  rings: 5,
  /*
   * A narrow span, because polished wood is one colour with faint figure in it,
   * not stripes. The gloss does the work of making it look like a surface.
   */
  dark: [76, 43, 25],
  light: [121, 74, 43],
  seed: 7,
} as const

/*
 * Noise periods are counted in lattice cells across the texture's width, and
 * are powers of two so every octave still lands on a whole number of cells —
 * that is what makes the wrap exact rather than approximate.
 */
const GRAIN_PERIOD = 8
const FIBRE_PERIOD = 16

const GRAIN_ROWS = 5
/* Kept well under the pixel height, or the fibres alias into moire. */
const FIBRE_ROWS = 34

/* How far the rings are pushed off true, in ring widths. Enough to keep them
 * from looking machined, not so much that they visibly ripple. */
const RING_DISTORTION = 0.85
const FIBRE_WEIGHT = 0.08

/*
 * Pushes the tone towards the pale end so the dark lines stay thin partings in
 * otherwise even wood. Nearer 1 than the sharp banding a higher power gives.
 */
const RING_CONTRAST = 1.25

/*
 * How much of the full light-to-dark sweep each ring actually uses. Narrowing
 * the palette is not enough on its own — the sine still swings corner to corner
 * every ring — so the excursion is squeezed towards the midtone as well. This
 * is the dial that decides between "figured wood" and "stripes".
 */
const GRAIN_STRENGTH = 0.5

export function createWoodCanvas(options: WoodTextureOptions = {}): HTMLCanvasElement {
  const { width, height, rings, dark, light, seed } = { ...DEFAULTS, ...options }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(width, height)
  const { data } = image

  for (let y = 0; y < height; y++) {
    const grainY = (y / height) * GRAIN_ROWS
    const fibreY = (y / height) * FIBRE_ROWS

    for (let x = 0; x < width; x++) {
      const u = x / width

      /* Wobble the rings so they meander instead of reading as clean stripes. */
      const wobble = fbm(u * GRAIN_PERIOD, grainY, GRAIN_PERIOD, seed, 3)
      const ring = (y / height) * rings + wobble * RING_DISTORTION

      let tone = (0.5 + 0.5 * Math.sin(ring * Math.PI * 2)) ** RING_CONTRAST

      /* Fine fibres drawn out along the rings, breaking up the banding. */
      const fibre = noise(u * FIBRE_PERIOD, fibreY, FIBRE_PERIOD, seed + 9)
      tone = tone * (1 - FIBRE_WEIGHT) + fibre * FIBRE_WEIGHT

      /* Squeeze towards the midtone: figure in the wood, not banding on it. */
      tone = 0.5 + (tone - 0.5) * GRAIN_STRENGTH

      const offset = (y * width + x) * 4
      data[offset] = dark[0] + (light[0] - dark[0]) * tone
      data[offset + 1] = dark[1] + (light[1] - dark[1]) * tone
      data[offset + 2] = dark[2] + (light[2] - dark[2]) * tone
      data[offset + 3] = 255
    }
  }

  ctx.putImageData(image, 0, 0)
  return canvas
}

/** Integer hash — sin-based hashing is far too slow over a whole bitmap. */
function hash(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Value noise that repeats every `period` cells along X. */
function noise(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi

  /* Smoothstep the interpolation, or the lattice shows through as a grid. */
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)

  /* Wrapping the lattice itself is what makes the tiling seamless. */
  const x0 = ((xi % period) + period) % period
  const x1 = (x0 + 1) % period

  const a = hash(x0, yi, seed)
  const b = hash(x1, yi, seed)
  const c = hash(x0, yi + 1, seed)
  const d = hash(x1, yi + 1, seed)

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}

function fbm(x: number, y: number, period: number, seed: number, octaves: number): number {
  let sum = 0
  let amplitude = 0.5
  let frequency = 1

  for (let i = 0; i < octaves; i++) {
    sum += amplitude * noise(x * frequency, y * frequency, period * frequency, seed + i)
    amplitude *= 0.5
    frequency *= 2
  }

  return sum
}
