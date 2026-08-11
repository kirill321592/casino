import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  RepeatWrapping,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
  type Object3D,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createWoodCanvas } from '@/shared/lib/woodTexture'
import { getPocketCenterAngle } from '../model/getPocketAngle'
import { getPocketColor, POCKET_COUNT, SEGMENT_ANGLE, WHEEL_ORDER } from '../model/wheelLayout'

/*
 * Wheel geometry, in scene units where the outer rim sits at radius 1.
 *
 * Angles follow the same convention as the model layer: theta is measured from
 * the +Z axis (the side facing the camera) and increases clockwise seen from
 * above, so `getWheelRotationForPocket` drops straight in — a pocket's local
 * angle plus the wheel's Y rotation is its world angle, and 0 faces the camera.
 */
const RIM_RADIUS = 1
const TRACK_RADIUS = 0.895

/*
 * Two concentric bands, as on a real wheel. The outer one carries the painted
 * numbers and is left clear; the frets and the pockets the ball actually drops
 * into sit on the inner band, so nothing ever crosses a digit.
 */
const NUMBER_RING_OUTER = 0.735
const NUMBER_RING_INNER = 0.625
const POCKET_RING_OUTER = NUMBER_RING_INNER
const POCKET_RING_INNER = 0.495

const CONE_RADIUS = 0.49
const CONE_HEIGHT = 0.28

const TRACK_HEIGHT = 0.17
const POCKET_FLOOR_Y = 0.012
const BALL_RADIUS = 0.036

const COLORS = {
  green: 0x0b6b3f,
  red: 0xa61b1b,
  black: 0x121212,
  gold: 0xc4a04a,
} as const

/*
 * The gold is satin, not mirror: a wide, soft highlight rather than a hard one.
 * Shared by the rim band, the hoops, the frets and the cone so the metal reads
 * as one finish across the wheel.
 */
const GOLD_ROUGHNESS = 0.42

const NUMBER_TEXTURE_SIZE = 1024
/* Where the digits sit across the number band, 0 = inner edge, 1 = outer. */
const NUMBER_RADIUS_RATIO = 0.5

/*
 * Dividing wall between two pockets: barely thicker than the ball's seam, and
 * low enough that the ball still stands proud of it once it has settled.
 */
const FRET_THICKNESS = 0.012
const FRET_HEIGHT = 0.02

/* Thin gold hoops on the band edges — what gives the wheel its ringed look. */
const BAND_RING_TUBE = 0.005

const CAMERA_FOV = 34
/* How far the widest part of the wheel — the skirt — reaches from the centre. */
const WHEEL_EXTENT = RIM_RADIUS + 0.085
/* Breathing room around that, so the rim never touches the canvas edge. */
const FRAMING_PADDING = 1.22

export interface WheelScene {
  scene: Scene
  camera: PerspectiveCamera
  /** Everything that turns with the wheel: bands, frets, cone and numbers. */
  wheel: Group
  /** Ball position is set directly in world space, so it is not a wheel child. */
  ball: Mesh
  /** Radius the ball orbits at while it is still riding the track. */
  trackRadius: number
  dispose: () => void
}

export function createWheelScene(renderer: WebGLRenderer): WheelScene {
  const scene = new Scene()
  const disposables: { dispose: () => void }[] = []

  const environment = applyEnvironment(scene, renderer)
  disposables.push(environment)

  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100)
  frameWheel(camera)

  addLights(scene)

  const wheel = new Group()
  const track = new Group()
  scene.add(wheel, track)

  buildBowl(track, disposables)
  buildPockets(wheel, disposables)
  buildNumberRing(wheel, disposables)
  buildCone(wheel, disposables)

  const ball = buildBall(disposables)
  scene.add(ball)

  return {
    scene,
    camera,
    wheel,
    ball,
    trackRadius: TRACK_RADIUS,
    dispose() {
      for (const item of disposables) item.dispose()
      scene.clear()
    },
  }
}

/**
 * Puts the eye straight above the wheel, far enough back that it all fits.
 *
 * Derived from the geometry rather than hand-tuned, so changing the rim or the
 * skirt cannot quietly start clipping the edges again. Looking down, the wheel
 * is as wide as it is tall on screen, so the same extent bounds both axes.
 *
 * Up is -Z, which points screen-up at world -Z and so screen-down at +Z. That
 * is the side the numbers' feet face and where theta 0 — the winning pocket —
 * comes to rest, so the digits read upright and the result lands nearest the
 * player, as it did from the old three-quarter view.
 */
function frameWheel(camera: PerspectiveCamera): void {
  const halfFov = (CAMERA_FOV / 2) * (Math.PI / 180)
  const distance = (WHEEL_EXTENT * FRAMING_PADDING) / Math.tan(halfFov)

  camera.up.set(0, 0, -1)
  camera.position.set(0, distance, 0)
  camera.lookAt(0, 0, 0)
}

/** Places the ball in the wheel plane at `angle`, `radius` out and `y` up. */
export function setBallPosition(ball: Object3D, angle: number, radius: number, y: number): void {
  ball.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius)
}

/** Radius the ball rests at once it has dropped into a pocket. */
export const POCKET_REST_RADIUS = (POCKET_RING_OUTER + POCKET_RING_INNER) / 2
export const POCKET_REST_Y = POCKET_FLOOR_Y + BALL_RADIUS
export const TRACK_REST_Y = TRACK_HEIGHT + BALL_RADIUS * 0.5

/*
 * A generated room gives the gold and the lacquer something to reflect. It is
 * built once into a PMREM cubemap, so nothing is downloaded and nothing is
 * re-rendered per frame.
 */
function applyEnvironment(scene: Scene, renderer: WebGLRenderer): { dispose: () => void } {
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const target = pmrem.fromScene(room, 0.04)

  scene.environment = target.texture
  scene.environmentIntensity = 0.6

  room.dispose?.()
  pmrem.dispose()

  return { dispose: () => target.dispose() }
}

function addLights(scene: Scene): void {
  /* The single directional light is what puts a hotspot on every curved
   * surface, so it stays modest and the ambient hemisphere carries more of the
   * exposure — same brightness overall, far less glare. */
  const key = new DirectionalLight(0xfff2d8, 1.8)
  key.position.set(1.6, 3.4, 2.2)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 9
  key.shadow.camera.left = -1.6
  key.shadow.camera.right = 1.6
  key.shadow.camera.top = 1.6
  key.shadow.camera.bottom = -1.6
  key.shadow.bias = -0.0012
  scene.add(key)

  const fill = new DirectionalLight(0x8fb4ff, 0.5)
  fill.position.set(-2.4, 1.4, -1.6)
  scene.add(fill)

  scene.add(new HemisphereLight(0xdfe9ff, 0x0a0806, 1))
}

/*
 * Generating the grain costs a chunk of main thread, and it never varies, so it
 * is built at most once per session. The canvas is cached rather than the
 * texture — each scene still owns a CanvasTexture it is free to dispose.
 */
let woodCanvas: HTMLCanvasElement | null = null

function getWoodCanvas(): HTMLCanvasElement {
  woodCanvas ??= createWoodCanvas()
  return woodCanvas
}

/**
 * The bowl the ball rolls in, as a lathed profile: a raised outer rim, the
 * banked ball track, then the apron falling away to the pockets.
 */
function buildBowl(parent: Group, disposables: { dispose: () => void }[]): void {
  const profile = [
    new Vector2(NUMBER_RING_OUTER - 0.005, POCKET_FLOOR_Y),
    new Vector2(NUMBER_RING_OUTER + 0.02, POCKET_FLOOR_Y + 0.008),
    new Vector2(0.78, 0.035),
    new Vector2(0.83, 0.075),
    new Vector2(0.868, 0.128),
    new Vector2(TRACK_RADIUS, TRACK_HEIGHT),
    new Vector2(0.935, TRACK_HEIGHT + 0.012),
    new Vector2(0.968, TRACK_HEIGHT + 0.055),
    new Vector2(RIM_RADIUS, TRACK_HEIGHT + 0.075),
    new Vector2(RIM_RADIUS + 0.055, TRACK_HEIGHT + 0.06),
    new Vector2(RIM_RADIUS + 0.075, TRACK_HEIGHT - 0.02),
    new Vector2(RIM_RADIUS + 0.08, -0.08),
    new Vector2(RIM_RADIUS + 0.02, -0.1),
    new Vector2(0.2, -0.1),
  ]

  /*
   * One grain shared by the bowl and the skirt. LatheGeometry runs V along the
   * profile, so the rings follow the turned surface from the pockets out over
   * the rim, the way they would on a wheel cut on a lathe.
   */
  const wood = new CanvasTexture(getWoodCanvas())
  wood.colorSpace = SRGBColorSpace
  wood.wrapS = RepeatWrapping
  wood.anisotropy = 8
  disposables.push(wood)

  const geometry = new LatheGeometry(profile, 160)
  const material = new MeshPhysicalMaterial({
    map: wood,
    roughness: 0.58,
    metalness: 0.06,
    /* Oiled rather than lacquered: the grain still catches light, but the sheen
     * is spread out instead of standing as a hard reflection. */
    clearcoat: 0.25,
    clearcoatRoughness: 0.45,
    side: DoubleSide,
  })
  const bowl = new Mesh(geometry, material)
  bowl.receiveShadow = true
  parent.add(bowl)
  disposables.push(geometry, material)

  const bandGeometry = new TorusGeometry(RIM_RADIUS + 0.04, 0.03, 20, 140)
  const goldMaterial = new MeshStandardMaterial({
    color: COLORS.gold,
    roughness: GOLD_ROUGHNESS,
    metalness: 1,
  })
  const band = new Mesh(bandGeometry, goldMaterial)
  band.rotation.x = Math.PI / 2
  band.position.y = TRACK_HEIGHT + 0.03
  band.castShadow = true
  parent.add(band)
  disposables.push(bandGeometry, goldMaterial)

  const skirtGeometry = new CylinderGeometry(RIM_RADIUS + 0.085, RIM_RADIUS + 0.02, 0.16, 120, 1, true)
  const skirtMaterial = new MeshPhysicalMaterial({
    map: wood,
    roughness: 0.66,
    metalness: 0.06,
    clearcoat: 0.18,
    clearcoatRoughness: 0.5,
    side: DoubleSide,
  })
  const skirt = new Mesh(skirtGeometry, skirtMaterial)
  skirt.position.y = -0.06
  parent.add(skirt)
  disposables.push(skirtGeometry, skirtMaterial)
}

/**
 * The two coloured bands and the frets between them.
 *
 * Both bands are cut into the same 37 sectors and share a colour, so a number
 * on the outer band lines up with the pocket the ball lands in. Only the inner
 * band gets frets — that keeps the blades well clear of the digits.
 */
function buildPockets(wheel: Group, disposables: { dispose: () => void }[]): void {
  const materials = {
    green: pocketMaterial(COLORS.green),
    red: pocketMaterial(COLORS.red),
    black: pocketMaterial(COLORS.black),
  }
  disposables.push(materials.green, materials.red, materials.black)

  for (let i = 0; i < POCKET_COUNT; i++) {
    const material = materials[getPocketColor(WHEEL_ORDER[i]!)]
    addSector(wheel, disposables, material, i, NUMBER_RING_INNER, NUMBER_RING_OUTER)
    addSector(wheel, disposables, material, i, POCKET_RING_INNER, POCKET_RING_OUTER)
  }

  buildFrets(wheel, disposables)
  buildBandRings(wheel, disposables)
}

/**
 * Concentric gold hoops on the edge of each band: one around the numbers, one
 * on the seam between the bands, one where the cone starts. They box the frets
 * into a ring of their own rather than leaving them floating on a flat disc.
 */
function buildBandRings(wheel: Group, disposables: { dispose: () => void }[]): void {
  const material = new MeshStandardMaterial({
    color: COLORS.gold,
    roughness: GOLD_ROUGHNESS,
    metalness: 1,
  })
  disposables.push(material)

  for (const radius of [NUMBER_RING_OUTER, NUMBER_RING_INNER, POCKET_RING_INNER]) {
    const geometry = new TorusGeometry(radius, BAND_RING_TUBE, 12, 180)
    const hoop = new Mesh(geometry, material)
    hoop.rotation.x = Math.PI / 2
    hoop.position.y = POCKET_FLOOR_Y + BAND_RING_TUBE
    hoop.castShadow = true
    wheel.add(hoop)
    disposables.push(geometry)
  }
}

/**
 * One coloured wedge of a band.
 *
 * RingGeometry is built in the XY plane from +X, and a vertex at local angle
 * theta ends up at wheel angle `theta + rotation.z + PI/2` once the -PI/2 tilt
 * is applied — so this offset puts sector i across the [i, i+1] segment, which
 * is exactly where its number is painted.
 */
function addSector(
  wheel: Group,
  disposables: { dispose: () => void }[],
  material: MeshPhysicalMaterial,
  index: number,
  innerRadius: number,
  outerRadius: number,
): void {
  const geometry = new RingGeometry(innerRadius, outerRadius, 1, 1, 0, SEGMENT_ANGLE)
  const sector = new Mesh(geometry, material)

  sector.rotation.x = -Math.PI / 2
  sector.rotation.z = index * SEGMENT_ANGLE - Math.PI / 2
  sector.position.y = POCKET_FLOOR_Y
  sector.receiveShadow = true

  wheel.add(sector)
  disposables.push(geometry)
}

/**
 * A fret is a flat wall between two pockets, not a spike: thin across, low, and
 * spanning only the inner band. Built at true size so nothing is stretched — a
 * scaled cylinder is what made these read as faceted wedges rather than blades.
 */
function buildFrets(wheel: Group, disposables: { dispose: () => void }[]): void {
  const geometry = new BoxGeometry(
    FRET_THICKNESS,
    FRET_HEIGHT,
    POCKET_RING_OUTER - POCKET_RING_INNER,
  )
  const material = new MeshStandardMaterial({
    color: COLORS.gold,
    roughness: GOLD_ROUGHNESS,
    metalness: 1,
  })
  disposables.push(geometry, material)

  const fretRadius = (POCKET_RING_INNER + POCKET_RING_OUTER) / 2

  for (let i = 0; i < POCKET_COUNT; i++) {
    /* Frets sit on the boundaries between pockets, not on their centres. */
    const angle = i * SEGMENT_ANGLE
    const fret = new Mesh(geometry, material)
    fret.position.set(
      Math.sin(angle) * fretRadius,
      POCKET_FLOOR_Y + FRET_HEIGHT / 2,
      Math.cos(angle) * fretRadius,
    )
    /* Rotating about Y aims the box's own Z outward, along the radius. */
    fret.rotation.y = angle
    fret.castShadow = true
    wheel.add(fret)
  }
}

function pocketMaterial(color: number): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.62,
    metalness: 0.1,
    clearcoat: 0.2,
    clearcoatRoughness: 0.5,
    side: DoubleSide,
  })
}

/**
 * Every pocket number in one transparent texture laid over the outer band.
 * RingGeometry maps UVs planar across its bounding square, so polar positions
 * painted on the canvas land exactly where they belong on the ring.
 */
function buildNumberRing(wheel: Group, disposables: { dispose: () => void }[]): void {
  const texture = createNumbersTexture()
  const geometry = new RingGeometry(NUMBER_RING_INNER, NUMBER_RING_OUTER, 128, 1)
  const material = new MeshStandardMaterial({
    map: texture,
    transparent: true,
    roughness: 0.5,
    metalness: 0,
    depthWrite: false,
    side: DoubleSide,
  })

  const ring = new Mesh(geometry, material)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = POCKET_FLOOR_Y + 0.001
  wheel.add(ring)
  disposables.push(geometry, material, texture)
}

function createNumbersTexture(): CanvasTexture {
  const size = NUMBER_TEXTURE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  const center = size / 2
  /* The ring's own outer radius maps to half the canvas, so scale within that. */
  const bandRadius =
    NUMBER_RING_INNER + (NUMBER_RING_OUTER - NUMBER_RING_INNER) * NUMBER_RADIUS_RATIO
  const textRadius = (bandRadius / NUMBER_RING_OUTER) * center

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#f4f1e8'
  ctx.shadowColor = 'rgba(0,0,0,0.65)'
  ctx.shadowBlur = 6

  for (let i = 0; i < POCKET_COUNT; i++) {
    const number = WHEEL_ORDER[i]!
    const angle = getPocketCenterAngle(number)
    /*
     * World (sin, cos) maps to canvas (+x, +y) once the ring's -PI/2 tilt is
     * unwound, so both axes read straight off the same angle.
     */
    const x = center + Math.sin(angle) * textRadius
    const y = center + Math.cos(angle) * textRadius

    ctx.save()
    ctx.translate(x, y)
    /*
     * Tops point at the centre, as on a real wheel. Rotating by -angle sends
     * the glyph's up vector to (-sin, -cos) — straight at the middle — so a
     * number reads upright to whoever is on that side of the table.
     */
    ctx.rotate(-angle)
    ctx.font = `700 ${number === 0 ? 46 : 40}px "Arial", sans-serif`
    ctx.fillText(String(number), 0, 0)
    ctx.restore()
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** The smooth turret in the middle: cone, ball cap and spindle. */
function buildCone(wheel: Group, disposables: { dispose: () => void }[]): void {
  const goldMaterial = new MeshStandardMaterial({
    color: COLORS.gold,
    roughness: GOLD_ROUGHNESS,
    metalness: 1,
  })
  disposables.push(goldMaterial)

  const coneGeometry = new ConeGeometry(CONE_RADIUS, CONE_HEIGHT, 96, 1, true)
  const cone = new Mesh(coneGeometry, goldMaterial)
  cone.position.y = POCKET_FLOOR_Y + CONE_HEIGHT / 2
  cone.castShadow = true
  cone.receiveShadow = true
  wheel.add(cone)
  disposables.push(coneGeometry)

  const capGeometry = new SphereGeometry(0.085, 32, 24)
  const cap = new Mesh(capGeometry, goldMaterial)
  cap.position.y = POCKET_FLOOR_Y + CONE_HEIGHT + 0.03
  cap.castShadow = true
  wheel.add(cap)
  disposables.push(capGeometry)

  const spindleGeometry = new CylinderGeometry(0.028, 0.028, 0.16, 20)
  const spindle = new Mesh(spindleGeometry, goldMaterial)
  spindle.position.y = POCKET_FLOOR_Y + CONE_HEIGHT + 0.11
  wheel.add(spindle)
  disposables.push(spindleGeometry)
}

function buildBall(disposables: { dispose: () => void }[]): Mesh {
  const geometry = new SphereGeometry(BALL_RADIUS, 32, 24)
  const material = new MeshPhysicalMaterial({
    color: 0xf6f4ef,
    /* Ivory, so it keeps a little more gloss than the wheel around it — it has
     * to stay findable against the pockets — but nothing like a glass bead. */
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
    sheen: 0.2,
  })

  const ball = new Mesh(geometry, material)
  ball.castShadow = true
  setBallPosition(ball, 0, TRACK_RADIUS, TRACK_REST_Y)
  disposables.push(geometry, material)

  return ball
}

export function configureRenderer(renderer: WebGLRenderer): void {
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = SRGBColorSpace
  renderer.shadowMap.enabled = true
}
