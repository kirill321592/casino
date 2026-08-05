import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { REEL_COUNT, SLOT_SYMBOLS } from '../model/symbols'

/* The symbol strip every drum carries, in a fixed order. */
export const STRIP = SLOT_SYMBOLS.map((entry) => entry.symbol)

const DRUM_RADIUS = 0.92
const DRUM_WIDTH = 0.98
const REEL_GAP = 0.14
/* Enlarged copy of each drum, faded in to stand for motion blur. */
const BLUR_DRUM_SCALE = 1.008

const CELL_PX = 256
const BLUR_PX = 14

const VIEW_PADDING = 0.42
export const SLOTS_VIEW_WIDTH = 720
export const SLOTS_VIEW_HEIGHT = 460

const COLORS = {
  cabinet: 0x1b1409,
  gold: 0xc9a227,
  inner: 0x05070d,
  payline: 0xfbbf24,
} as const

export interface Reel {
  /* Static container: holds the drum and the highlights, and scales on a win. */
  group: Group
  /* Only this turns, so the payline and glow stay put while symbols scroll. */
  drum: Group
  sharp: MeshStandardMaterial
  blurred: MeshStandardMaterial
  /* Gold edge that lights up while this reel teases. */
  glow: MeshStandardMaterial
  /* Halo behind the payline symbol when the reel is part of a winning line. */
  winGlow: MeshStandardMaterial
  /* Continuous index into STRIP of the symbol sitting on the payline. */
  position: number
}

export interface SlotsScene {
  scene: Scene
  camera: PerspectiveCamera
  reels: Reel[]
  dispose: () => void
}

export function createSlotsScene(
  renderer: WebGLRenderer,
  initialSymbols: string[],
): SlotsScene {
  const scene = new Scene()
  const disposables: { dispose: () => void }[] = []

  disposables.push(applyEnvironment(scene, renderer))

  const totalWidth = REEL_COUNT * DRUM_WIDTH + (REEL_COUNT - 1) * REEL_GAP
  const camera = new PerspectiveCamera(38, SLOTS_VIEW_WIDTH / SLOTS_VIEW_HEIGHT, 0.1, 50)
  camera.position.set(0, 0.32, 4.15)
  camera.lookAt(0, 0, 0)

  addLights(scene)

  const sharpTexture = createStripTexture(0)
  const blurTexture = createStripTexture(BLUR_PX)
  disposables.push(sharpTexture, blurTexture)

  const reels: Reel[] = []
  for (let i = 0; i < REEL_COUNT; i++) {
    const reel = createReel(sharpTexture, blurTexture, disposables)
    reel.group.position.x = -totalWidth / 2 + DRUM_WIDTH / 2 + i * (DRUM_WIDTH + REEL_GAP)
    scene.add(reel.group)

    setReelPosition(reel, Math.max(0, STRIP.indexOf(initialSymbols[i] ?? STRIP[0]!)))
    reels.push(reel)
  }

  buildCabinet(scene, totalWidth, disposables)
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
 * Turns the drum so `position` (a continuous index into STRIP) faces front.
 *
 * The texture's U axis runs around the circumference, so one strip step is one
 * full symbol of arc — the drum angle is just the index scaled to a turn.
 */
export function setReelPosition(reel: Reel, position: number): void {
  reel.position = position
  reel.drum.rotation.x = (position / STRIP.length) * Math.PI * 2
}

/** Fades the blurred drum in with speed, so fast reels smear like real ones. */
export function setReelBlur(reel: Reel, rowsPerFrame: number): void {
  const intensity = Math.min(rowsPerFrame / 0.55, 1)
  reel.blurred.opacity = intensity
  reel.sharp.opacity = 1 - intensity * 0.55
}

/** Swells a reel that paid, so a win reads without touching the geometry. */
export function pulseReel(reel: Reel, amount: number): void {
  reel.group.scale.setScalar(1 + amount * 0.06)
  reel.winGlow.opacity = amount * 0.55
  reel.winGlow.emissiveIntensity = 0.6 + amount * 2.4
}

function createReel(
  sharpTexture: CanvasTexture,
  blurTexture: CanvasTexture,
  disposables: { dispose: () => void }[],
): Reel {
  const group = new Group()
  const drum = new Group()
  group.add(drum)

  const drumGeometry = new CylinderGeometry(DRUM_RADIUS, DRUM_RADIUS, DRUM_WIDTH, 96, 1, true)
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

  /* Highlights hang off the static group, so they never turn with the drum. */
  const winGlowGeometry = new PlaneGeometry(DRUM_WIDTH * 1.04, 0.62)
  const winGlow = new MeshStandardMaterial({
    color: COLORS.payline,
    emissive: new Color(COLORS.payline),
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
  const winGlowMesh = new Mesh(winGlowGeometry, winGlow)
  winGlowMesh.position.z = DRUM_RADIUS + 0.035
  group.add(winGlowMesh)
  disposables.push(winGlowGeometry, winGlow)

  const glowGeometry = new PlaneGeometry(DRUM_WIDTH * 1.16, 1.86)
  const glow = new MeshStandardMaterial({
    color: COLORS.gold,
    emissive: new Color(COLORS.gold),
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: DoubleSide,
  })
  const glowMesh = new Mesh(glowGeometry, glow)
  glowMesh.position.z = DRUM_RADIUS + 0.06
  group.add(glowMesh)
  disposables.push(glowGeometry, glow)

  return { group, drum, sharp, blurred, glow, winGlow, position: 0 }
}

function drumMaterial(map: CanvasTexture): MeshStandardMaterial {
  return new MeshStandardMaterial({
    map,
    roughness: 0.55,
    metalness: 0.08,
    transparent: true,
    side: DoubleSide,
  })
}

/**
 * One texture shared by every drum: the strip laid left to right, each symbol
 * turned a quarter turn so it stands upright once the cylinder's U axis is
 * wrapped vertically around the front of the reel.
 */
function createStripTexture(blurPx: number): CanvasTexture {
  const arcPerSymbol = (Math.PI * 2 * DRUM_RADIUS) / STRIP.length
  const width = STRIP.length * CELL_PX
  const height = Math.round(CELL_PX * (DRUM_WIDTH / arcPerSymbol))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')!

  const backdrop = ctx.createLinearGradient(0, 0, 0, height)
  backdrop.addColorStop(0, '#e8e3d6')
  backdrop.addColorStop(0.5, '#fbfaf5')
  backdrop.addColorStop(1, '#e8e3d6')
  ctx.fillStyle = backdrop
  ctx.fillRect(0, 0, width, height)

  /* Ribs between symbols, so the drum reads as a segmented strip. */
  ctx.strokeStyle = 'rgba(40,30,15,0.28)'
  ctx.lineWidth = 5
  for (let i = 0; i <= STRIP.length; i++) {
    const x = i * CELL_PX
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  if (blurPx > 0) ctx.filter = `blur(${blurPx}px)`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${Math.round(CELL_PX * 0.62)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`

  STRIP.forEach((symbol, index) => {
    ctx.save()
    ctx.translate((index + 0.5) * CELL_PX, height / 2)
    /* Canvas +x maps to screen up on the drum face, so upright means +90deg. */
    ctx.rotate(Math.PI / 2)
    ctx.fillText(symbol, 0, 0)
    ctx.restore()
  })

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.anisotropy = 8
  return texture
}

function applyEnvironment(scene: Scene, renderer: WebGLRenderer): { dispose: () => void } {
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
  const key = new DirectionalLight(0xfff4e2, 2.2)
  key.position.set(0.8, 2.6, 3.4)
  scene.add(key)

  const rim = new DirectionalLight(0xffc46b, 1.1)
  rim.position.set(-2.6, 0.6, 1.2)
  scene.add(rim)

  const marquee = new PointLight(0xffd27a, 6, 8, 2)
  marquee.position.set(0, 1.5, 1.6)
  scene.add(marquee)

  scene.add(new HemisphereLight(0xcfe0ff, 0x0a0806, 0.45))
}

/** Frame around the reels, with a dark recess so the drums sit inside it. */
function buildCabinet(
  scene: Scene,
  totalWidth: number,
  disposables: { dispose: () => void }[],
): void {
  const outerWidth = totalWidth + VIEW_PADDING * 2
  const outerHeight = DRUM_RADIUS * 2 + VIEW_PADDING * 1.4

  const goldMaterial = new MeshPhysicalMaterial({
    color: COLORS.gold,
    roughness: 0.24,
    metalness: 1,
    clearcoat: 0.6,
  })
  const bodyMaterial = new MeshPhysicalMaterial({
    color: COLORS.cabinet,
    roughness: 0.42,
    metalness: 0.3,
    clearcoat: 0.5,
  })
  disposables.push(goldMaterial, bodyMaterial)

  const backGeometry = new BoxGeometry(outerWidth, outerHeight, 0.3)
  const back = new Mesh(backGeometry, bodyMaterial)
  back.position.z = -DRUM_RADIUS - 0.3
  scene.add(back)
  disposables.push(backGeometry)

  /* Four bezel bars framing the window, kept thin so the drums stay readable. */
  const barThickness = 0.16
  const horizontalGeometry = new BoxGeometry(outerWidth, barThickness, 0.5)
  const verticalGeometry = new BoxGeometry(barThickness, outerHeight, 0.5)
  disposables.push(horizontalGeometry, verticalGeometry)

  const halfHeight = outerHeight / 2 - barThickness / 2
  const halfWidth = outerWidth / 2 - barThickness / 2

  for (const y of [halfHeight, -halfHeight]) {
    const bar = new Mesh(horizontalGeometry, goldMaterial)
    bar.position.set(0, y, DRUM_RADIUS - 0.1)
    scene.add(bar)
  }
  for (const x of [halfWidth, -halfWidth]) {
    const bar = new Mesh(verticalGeometry, goldMaterial)
    bar.position.set(x, 0, DRUM_RADIUS - 0.1)
    scene.add(bar)
  }

  /* Separators standing between the drums, hiding the gaps. */
  const dividerGeometry = new BoxGeometry(REEL_GAP * 0.7, outerHeight - barThickness * 2, 0.42)
  disposables.push(dividerGeometry)
  for (let i = 1; i < REEL_COUNT; i++) {
    const divider = new Mesh(dividerGeometry, bodyMaterial)
    divider.position.set(
      -totalWidth / 2 + i * (DRUM_WIDTH + REEL_GAP) - REEL_GAP / 2,
      0,
      DRUM_RADIUS - 0.12,
    )
    scene.add(divider)
  }
}

/** The row that pays: a lit bar across the drums with a pointer at each end. */
function buildPayline(
  scene: Scene,
  totalWidth: number,
  disposables: { dispose: () => void }[],
): void {
  const geometry = new BoxGeometry(totalWidth + VIEW_PADDING, 0.012, 0.012)
  const material = new MeshStandardMaterial({
    color: COLORS.payline,
    emissive: new Color(COLORS.payline),
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.4,
  })

  const line = new Mesh(geometry, material)
  line.position.z = DRUM_RADIUS + 0.14
  scene.add(line)
  disposables.push(geometry, material)
}

export function configureRenderer(renderer: WebGLRenderer): void {
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.outputColorSpace = SRGBColorSpace
}
