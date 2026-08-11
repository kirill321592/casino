import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { REEL_COUNT, SLOT_SYMBOLS } from '../model/symbols'

/** Symbols showing through the window at once. The middle row is the payline. */
export const VISIBLE_ROWS = 3
/** How many times the symbol set is laid out around a drum. */
const STRIP_WRAPS = 3
const CELL_COUNT = SLOT_SYMBOLS.length * STRIP_WRAPS

/* Arc length one symbol takes up on the drum surface; the radius follows from
 * it, so more cells make a bigger drum rather than smaller symbols. */
const ROW_ARC = 0.62
const DRUM_RADIUS = (CELL_COUNT * ROW_ARC) / (Math.PI * 2)
const DRUM_WIDTH = 0.82
const REEL_GAP = 0.1
const ROW_ANGLE = (Math.PI * 2) / CELL_COUNT
/* Straight-on height of the window: the chord spanning the visible rows. */
const APERTURE_HEIGHT = 2 * DRUM_RADIUS * Math.sin((VISIBLE_ROWS * ROW_ANGLE) / 2)
/* Projected height of the payline row, used to size the win highlight. */
const PAYLINE_ROW_HEIGHT = 2 * DRUM_RADIUS * Math.sin(ROW_ANGLE / 2)

/* Enlarged copy of each drum, faded in to stand for motion blur. */
const BLUR_DRUM_SCALE = 1.006

const CELL_PX = 192
/* Half-width of the smear on the blurred strip, as a fraction of a cell. */
const BLUR_SPREAD = 0.26
const BLUR_SAMPLES = 11

/* The face has to reach past the drums, which are far taller than the window:
 * every part of a cylinder outside the three rows stays behind the cabinet. */
const FRAME_WIDTH = 1
const FRAME_HEIGHT = DRUM_RADIUS - APERTURE_HEIGHT / 2 + 0.6
const CABINET_DEPTH = DRUM_RADIUS * 2 + 0.7
/* Front face of the cabinet: everything player-facing sits at or before it. */
const FRONT_Z = DRUM_RADIUS + 0.22

export const SLOTS_VIEW_WIDTH = 720
export const SLOTS_VIEW_HEIGHT = 500

const COLORS = {
  cabinet: 0x14100a,
  gold: 0xc9a227,
  payline: 0xfbbf24,
} as const

interface Disposable {
  dispose: () => void
}

export interface Reel {
  /* Static container: holds the drum and the highlights, and scales on a win. */
  group: Group
  /* Only this turns, so the payline and glow stay put while symbols scroll. */
  drum: Group
  /* This drum's own symbol order — every reel gets a different one. */
  strip: string[]
  sharp: MeshStandardMaterial
  blurred: MeshStandardMaterial
  /* Gold edge that lights up while this reel teases. */
  glow: MeshBasicMaterial
  /* Halo around the payline symbol when the reel is part of a winning line. */
  winGlow: MeshBasicMaterial
  /* Continuous index into `strip` of the symbol sitting on the payline. */
  position: number
}

export interface SlotsScene {
  scene: Scene
  camera: PerspectiveCamera
  reels: Reel[]
  dispose: () => void
}

export function createSlotsScene(renderer: WebGLRenderer, initialSymbols: string[]): SlotsScene {
  const scene = new Scene()
  const disposables: Disposable[] = []

  disposables.push(applyEnvironment(scene, renderer))

  const totalWidth = REEL_COUNT * DRUM_WIDTH + (REEL_COUNT - 1) * REEL_GAP
  const camera = new PerspectiveCamera(38, SLOTS_VIEW_WIDTH / SLOTS_VIEW_HEIGHT, 0.1, 50)
  /* Framed on the window with the machine's face running off every edge, the
   * way a cabinet looks from the stool, and a touch above centre. */
  camera.position.set(0, 0.1, 6.55)
  camera.lookAt(0, 0, 0)

  addLights(scene)

  const reels: Reel[] = []
  for (let i = 0; i < REEL_COUNT; i++) {
    const reel = createReel(buildStrip(i + 1), disposables)
    reel.group.position.x = -totalWidth / 2 + DRUM_WIDTH / 2 + i * (DRUM_WIDTH + REEL_GAP)
    scene.add(reel.group)

    setReelPosition(reel, Math.max(0, reel.strip.indexOf(initialSymbols[i] ?? reel.strip[0]!)))
    reels.push(reel)
  }

  buildCabinet(scene, totalWidth, disposables)
  buildGlass(scene, totalWidth, disposables)
  buildPayline(scene, totalWidth, disposables)

  return {
    scene,
    camera,
    reels,
    dispose() {
      for (const item of disposables) item.dispose()
      scene.clear()
    },
  }
}

/**
 * Turns the drum so `position` (a continuous index into the reel's strip) faces
 * front.
 *
 * The texture's U axis runs around the circumference, so one strip step is one
 * full symbol of arc — the drum angle is just the index scaled to a turn.
 */
export function setReelPosition(reel: Reel, position: number): void {
  reel.position = position
  /* Half a cell of lead-in: the strip starts at a seam, and it is the middle of
   * a symbol that has to line up with the payline. */
  reel.drum.rotation.x = ((position + 0.5) / reel.strip.length) * Math.PI * 2
}

/** Fades the blurred drum in with speed, so fast reels smear like real ones. */
export function setReelBlur(reel: Reel, rowsPerFrame: number): void {
  const intensity = Math.min(rowsPerFrame / 1.6, 1)
  reel.blurred.opacity = intensity
  reel.sharp.opacity = 1 - intensity * 0.55
}

/** Swells a reel that paid, so a win reads without touching the geometry. */
export function pulseReel(reel: Reel, amount: number): void {
  reel.group.scale.setScalar(1 + amount * 0.05)
  reel.winGlow.opacity = amount * 0.9
}

/**
 * Lays the symbol set around a drum `STRIP_WRAPS` times, shuffled afresh each
 * time round, so the rows above and below the payline differ from reel to reel
 * the way a real machine's strips do. Seeded, so a reel looks the same on every
 * mount.
 */
function buildStrip(seed: number): string[] {
  const symbols = SLOT_SYMBOLS.map((entry) => entry.symbol)
  const random = mulberry32(seed)
  const strip: string[] = []

  for (let wrap = 0; wrap < STRIP_WRAPS; wrap++) {
    const chunk = shuffle(symbols, random)
    /* The strip is a loop, so both seams — and the closing one — need checking. */
    if (chunk[0] === strip.at(-1)) swap(chunk, 0, 1)
    strip.push(...chunk)
  }
  if (strip.at(-1) === strip[0]) swap(strip, strip.length - 1, strip.length - 2)

  return strip
}

function shuffle(values: string[], random: () => number): string[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) swap(result, i, Math.floor(random() * (i + 1)))
  return result
}

function swap(values: string[], a: number, b: number): void {
  ;[values[a], values[b]] = [values[b]!, values[a]!]
}

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createReel(strip: string[], disposables: Disposable[]): Reel {
  const group = new Group()
  const drum = new Group()
  group.add(drum)

  const sharpTexture = createStripTexture(strip, false)
  const blurTexture = createStripTexture(strip, true)
  disposables.push(sharpTexture, blurTexture)

  const drumGeometry = new CylinderGeometry(DRUM_RADIUS, DRUM_RADIUS, DRUM_WIDTH, 128, 1, true)
  disposables.push(drumGeometry)

  /*
   * The cylinder's own axis is laid along X so the strip wraps vertically; the
   * spin is applied to the parent, which keeps that setup out of the Euler order.
   */
  const sharp = drumMaterial(sharpTexture)
  const sharpMesh = new Mesh(drumGeometry, sharp)
  sharpMesh.rotation.z = Math.PI / 2
  drum.add(sharpMesh)

  const blurred = drumMaterial(blurTexture)
  blurred.opacity = 0
  const blurMesh = new Mesh(drumGeometry, blurred)
  blurMesh.rotation.z = Math.PI / 2
  blurMesh.scale.setScalar(BLUR_DRUM_SCALE)
  drum.add(blurMesh)

  disposables.push(sharp, blurred)

  /* Solid core just inside the strip: without it the far side of the drum shows
   * through while the front face fades for blur. */
  const coreGeometry = new CylinderGeometry(DRUM_RADIUS * 0.98, DRUM_RADIUS * 0.98, DRUM_WIDTH)
  const coreMaterial = new MeshStandardMaterial({ color: 0x120e08, roughness: 0.9 })
  const core = new Mesh(coreGeometry, coreMaterial)
  core.rotation.z = Math.PI / 2
  group.add(core)
  disposables.push(coreGeometry, coreMaterial)

  /*
   * Highlights hang off the static group, so they never turn with the drum.
   * Both add light rather than paint over the strip, and both are brightest at
   * their edges — a symbol stays readable through the flash it is causing.
   */
  const winGlowTexture = createGlowTexture('y')
  const winGlowGeometry = new PlaneGeometry(DRUM_WIDTH * 1.02, PAYLINE_ROW_HEIGHT * 1.15)
  const winGlow = glowMaterial(winGlowTexture, COLORS.payline)
  const winGlowMesh = new Mesh(winGlowGeometry, winGlow)
  winGlowMesh.position.z = DRUM_RADIUS + 0.04
  group.add(winGlowMesh)
  disposables.push(winGlowTexture, winGlowGeometry, winGlow)

  const glowTexture = createGlowTexture('x')
  const glowGeometry = new PlaneGeometry(DRUM_WIDTH * 1.1, APERTURE_HEIGHT)
  const glow = glowMaterial(glowTexture, COLORS.gold)
  const glowMesh = new Mesh(glowGeometry, glow)
  glowMesh.position.z = DRUM_RADIUS + 0.07
  group.add(glowMesh)
  disposables.push(glowTexture, glowGeometry, glow)

  return { group, drum, strip, sharp, blurred, glow, winGlow, position: 0 }
}

function glowMaterial(map: CanvasTexture, color: number): MeshBasicMaterial {
  return new MeshBasicMaterial({
    map,
    color,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  })
}

/** Light banked against the edges of a cell, thin through the middle. */
function createGlowTexture(axis: 'x' | 'y'): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  const gradient =
    axis === 'x' ? ctx.createLinearGradient(0, 0, size, 0) : ctx.createLinearGradient(0, 0, 0, size)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.22, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.14)')
  gradient.addColorStop(0.78, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(1, 'rgba(255,255,255,1)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function drumMaterial(map: CanvasTexture): MeshStandardMaterial {
  return new MeshStandardMaterial({
    map,
    roughness: 0.62,
    metalness: 0.04,
    transparent: true,
    side: DoubleSide,
  })
}

/**
 * The printed strip for one drum: its symbols laid left to right, each turned a
 * quarter turn so it stands upright once the cylinder's U axis is wrapped
 * vertically around the front of the reel.
 *
 * The blurred copy smears along the strip rather than in all directions, since
 * that is the one axis a spinning drum actually travels.
 */
function createStripTexture(strip: string[], blurred: boolean): CanvasTexture {
  const width = strip.length * CELL_PX
  const height = Math.round(CELL_PX * (DRUM_WIDTH / ROW_ARC))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')!

  /* Paper-white strip, shaded towards its edges where it curves off the drum. */
  const backdrop = ctx.createLinearGradient(0, 0, 0, height)
  backdrop.addColorStop(0, '#d8d2c4')
  backdrop.addColorStop(0.12, '#f4f1e8')
  backdrop.addColorStop(0.5, '#fdfcf8')
  backdrop.addColorStop(0.88, '#f4f1e8')
  backdrop.addColorStop(1, '#d8d2c4')
  ctx.fillStyle = backdrop
  ctx.fillRect(0, 0, width, height)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${Math.round(CELL_PX * 0.66)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`

  if (!blurred) {
    /* Seams between symbols, so the drum reads as a segmented strip. */
    ctx.strokeStyle = 'rgba(40,30,15,0.2)'
    ctx.lineWidth = 4
    for (let i = 0; i <= strip.length; i++) {
      const x = i * CELL_PX
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }

  const offsets = blurred ? smearOffsets() : [0]
  ctx.globalAlpha = 1 / offsets.length

  strip.forEach((symbol, index) => {
    for (const offset of offsets) {
      ctx.save()
      ctx.translate((index + 0.5) * CELL_PX + offset, height / 2)
      /* Canvas +x maps to screen up on the drum face, so upright means +90deg. */
      ctx.rotate(Math.PI / 2)
      ctx.fillText(symbol, 0, 0)
      ctx.restore()
    }
  })

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.anisotropy = 8
  return texture
}

/* Copies spread along the direction of travel, wrapping past the cell edges. */
function smearOffsets(): number[] {
  const span = CELL_PX * BLUR_SPREAD
  return Array.from({ length: BLUR_SAMPLES }, (_, i) => -span + (2 * span * i) / (BLUR_SAMPLES - 1))
}

function applyEnvironment(scene: Scene, renderer: WebGLRenderer): Disposable {
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const target = pmrem.fromScene(room, 0.04)

  scene.environment = target.texture
  scene.environmentIntensity = 0.4

  room.dispose?.()
  pmrem.dispose()

  return { dispose: () => target.dispose() }
}

function addLights(scene: Scene): void {
  const key = new DirectionalLight(0xfff4e2, 1.5)
  key.position.set(0.8, 2.6, 3.4)
  scene.add(key)

  const rim = new DirectionalLight(0xffc46b, 1)
  rim.position.set(-2.6, 0.6, 1.2)
  scene.add(rim)

  /* Warm wash into the top and bottom of the recess. Directional rather than a
   * lamp, so all three drums are lit alike instead of the middle one flaring. */
  const marquee = new DirectionalLight(0xffd27a, 1.1)
  marquee.position.set(0, 2.4, 1.1)
  scene.add(marquee)

  const fill = new DirectionalLight(0xfff0d0, 0.8)
  fill.position.set(0, -2.2, 1.3)
  scene.add(fill)

  scene.add(new HemisphereLight(0xcfe0ff, 0x0a0806, 0.25))
}

/**
 * Frame around the reels. The panels run the full depth of the cabinet, so the
 * drums are only ever seen through the window — the rest of each cylinder is
 * hidden behind the machine's face, as it would be in a real one.
 */
function buildCabinet(scene: Scene, totalWidth: number, disposables: Disposable[]): void {
  const outerWidth = totalWidth + FRAME_WIDTH * 2
  const outerHeight = APERTURE_HEIGHT + FRAME_HEIGHT * 2
  const panelZ = FRONT_Z - CABINET_DEPTH / 2

  const goldMaterial = new MeshPhysicalMaterial({
    color: COLORS.gold,
    roughness: 0.22,
    metalness: 1,
    clearcoat: 0.6,
  })
  const bodyMaterial = new MeshPhysicalMaterial({
    color: COLORS.cabinet,
    roughness: 0.62,
    metalness: 0.15,
    clearcoat: 0.35,
  })
  disposables.push(goldMaterial, bodyMaterial)

  const backGeometry = new BoxGeometry(outerWidth, outerHeight, 0.3)
  const back = new Mesh(backGeometry, bodyMaterial)
  back.position.z = FRONT_Z - CABINET_DEPTH - 0.15
  scene.add(back)
  disposables.push(backGeometry)

  /* Four solid panels boxing in the window. */
  const horizontalGeometry = new BoxGeometry(outerWidth, FRAME_HEIGHT, CABINET_DEPTH)
  const verticalGeometry = new BoxGeometry(FRAME_WIDTH, outerHeight, CABINET_DEPTH)
  disposables.push(horizontalGeometry, verticalGeometry)

  for (const y of [1, -1]) {
    const panel = new Mesh(horizontalGeometry, bodyMaterial)
    panel.position.set(0, (y * (APERTURE_HEIGHT + FRAME_HEIGHT)) / 2, panelZ)
    scene.add(panel)
  }
  for (const x of [1, -1]) {
    const panel = new Mesh(verticalGeometry, bodyMaterial)
    panel.position.set((x * (totalWidth + FRAME_WIDTH)) / 2, 0, panelZ)
    scene.add(panel)
  }

  /* Gold trim closing into a rectangle around the window — the machine's bezel. */
  const trim = 0.12
  const trimHorizontal = new BoxGeometry(totalWidth + trim * 2, trim, 0.1)
  const trimVertical = new BoxGeometry(trim, APERTURE_HEIGHT + trim * 2, 0.1)
  disposables.push(trimHorizontal, trimVertical)

  for (const y of [1, -1]) {
    const bar = new Mesh(trimHorizontal, goldMaterial)
    bar.position.set(0, (y * (APERTURE_HEIGHT + trim)) / 2, FRONT_Z + 0.04)
    scene.add(bar)
  }
  for (const x of [1, -1]) {
    const bar = new Mesh(trimVertical, goldMaterial)
    bar.position.set((x * (totalWidth + trim)) / 2, 0, FRONT_Z + 0.04)
    scene.add(bar)
  }

  /* Separators standing between the drums, hiding the gaps. */
  const dividerGeometry = new BoxGeometry(REEL_GAP, APERTURE_HEIGHT, CABINET_DEPTH)
  disposables.push(dividerGeometry)
  for (let i = 1; i < REEL_COUNT; i++) {
    const divider = new Mesh(dividerGeometry, bodyMaterial)
    divider.position.set(-totalWidth / 2 + i * (DRUM_WIDTH + REEL_GAP) - REEL_GAP / 2, 0, panelZ)
    scene.add(divider)
  }
}

/**
 * The pane over the window: shadow where the drums recede into the cabinet at
 * the top and bottom rows, and a faint sheen across the glass. Doing it as one
 * overlay keeps the payline row the brightest thing on screen.
 */
function buildGlass(scene: Scene, totalWidth: number, disposables: Disposable[]): void {
  const texture = createGlassTexture()
  const geometry = new PlaneGeometry(totalWidth, APERTURE_HEIGHT)
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  })

  const glass = new Mesh(geometry, material)
  glass.position.z = FRONT_Z - 0.02
  scene.add(glass)
  disposables.push(texture, geometry, material)
}

function createGlassTexture(): CanvasTexture {
  const width = 512
  const height = Math.round((width * APERTURE_HEIGHT) / (REEL_COUNT * DRUM_WIDTH))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')!

  const shade = ctx.createLinearGradient(0, 0, 0, height)
  shade.addColorStop(0, 'rgba(3,5,10,0.7)')
  shade.addColorStop(0.14, 'rgba(3,5,10,0.2)')
  shade.addColorStop(0.34, 'rgba(3,5,10,0)')
  shade.addColorStop(0.66, 'rgba(3,5,10,0)')
  shade.addColorStop(0.86, 'rgba(3,5,10,0.2)')
  shade.addColorStop(1, 'rgba(3,5,10,0.7)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, width, height)

  /* A single soft diagonal band — enough to read as glass, not as a smudge. */
  const sheen = ctx.createLinearGradient(0, height, width * 0.7, 0)
  sheen.addColorStop(0.32, 'rgba(255,255,255,0)')
  sheen.addColorStop(0.46, 'rgba(255,255,255,0.07)')
  sheen.addColorStop(0.6, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, width, height)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** The row that pays: a lit bar across the drums with a pointer at each end. */
function buildPayline(scene: Scene, totalWidth: number, disposables: Disposable[]): void {
  const material = new MeshStandardMaterial({
    color: COLORS.payline,
    emissive: new Color(COLORS.payline),
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.45,
  })
  disposables.push(material)

  const lineGeometry = new BoxGeometry(totalWidth, 0.012, 0.012)
  const line = new Mesh(lineGeometry, material)
  line.position.z = FRONT_Z
  scene.add(line)
  disposables.push(lineGeometry)

  /* Diamonds sitting on the trim, marking which row is the live one. */
  const pointerGeometry = new BoxGeometry(0.075, 0.075, 0.03)
  disposables.push(pointerGeometry)
  for (const x of [1, -1]) {
    const pointer = new Mesh(pointerGeometry, material)
    pointer.position.set((x * (totalWidth + 0.12)) / 2, 0, FRONT_Z + 0.12)
    pointer.rotation.z = Math.PI / 4
    scene.add(pointer)
  }
}

export function configureRenderer(renderer: WebGLRenderer): void {
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.outputColorSpace = SRGBColorSpace
}
