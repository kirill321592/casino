import { Container, Graphics, Text } from 'pixi.js'
import {
  getPocketColor,
  POCKET_COUNT,
  SEGMENT_ANGLE,
  WHEEL_ORDER,
} from '../model/wheelLayout'

const COLORS = {
  green: 0x0d7a4a,
  red: 0xb91c1c,
  black: 0x171717,
  gold: 0xc9a227,
  rim: 0x2a2a2a,
} as const

const OUTER_RADIUS = 230
const INNER_RADIUS = 165
const LABEL_RADIUS = 198

export const WHEEL_SIZE = 520

export interface WheelScene {
  root: Container
  wheel: Container
  ballArm: Container
}

export function createWheelScene(): WheelScene {
  const root = new Container()
  const wheel = new Container()
  const ballArm = new Container()

  root.addChild(wheel)
  root.addChild(ballArm)

  drawRim(wheel)
  drawPockets(wheel)
  drawCenterCap(wheel)
  drawBall(ballArm)
  drawMarker(root)

  return { root, wheel, ballArm }
}

function drawRim(wheel: Container): void {
  const rim = new Graphics()
  rim.circle(0, 0, OUTER_RADIUS + 8)
  rim.fill({ color: COLORS.rim })
  rim.circle(0, 0, OUTER_RADIUS + 2)
  rim.fill({ color: COLORS.gold })
  wheel.addChild(rim)
}

function drawPockets(wheel: Container): void {
  for (let i = 0; i < POCKET_COUNT; i++) {
    const number = WHEEL_ORDER[i]!
    const startAngle = i * SEGMENT_ANGLE - Math.PI / 2
    const endAngle = startAngle + SEGMENT_ANGLE
    const colorKey = getPocketColor(number)
    const color = COLORS[colorKey]

    const segment = new Graphics()
    segment.moveTo(
      Math.cos(startAngle) * INNER_RADIUS,
      Math.sin(startAngle) * INNER_RADIUS,
    )
    segment.arc(0, 0, OUTER_RADIUS, startAngle, endAngle)
    segment.arc(0, 0, INNER_RADIUS, endAngle, startAngle, true)
    segment.closePath()
    segment.fill({ color })

    wheel.addChild(segment)

    const labelAngle = startAngle + SEGMENT_ANGLE / 2
    const label = new Text({
      text: String(number),
      style: {
        fill: 0xffffff,
        fontSize: number === 0 ? 14 : 11,
        fontWeight: '700',
        fontFamily: 'Arial, sans-serif',
      },
    })
    label.anchor.set(0.5)
    label.x = Math.cos(labelAngle) * LABEL_RADIUS
    label.y = Math.sin(labelAngle) * LABEL_RADIUS
    label.rotation = labelAngle + Math.PI / 2
    wheel.addChild(label)
  }
}

function drawCenterCap(wheel: Container): void {
  const cap = new Graphics()
  cap.circle(0, 0, INNER_RADIUS - 4)
  cap.fill({ color: 0x0f172a })
  cap.circle(0, 0, INNER_RADIUS - 14)
  cap.fill({ color: COLORS.gold })
  wheel.addChild(cap)
}

function drawBall(ballArm: Container): void {
  const ball = new Graphics()
  ball.circle(0, -OUTER_RADIUS + 18, 9)
  ball.fill({ color: 0xf8fafc })
  ball.circle(0, -OUTER_RADIUS + 18, 9)
  ball.stroke({ color: 0x94a3b8, width: 2 })
  ballArm.addChild(ball)
}

function drawMarker(root: Container): void {
  const marker = new Graphics()
  marker.moveTo(-10, -OUTER_RADIUS - 18)
  marker.lineTo(10, -OUTER_RADIUS - 18)
  marker.lineTo(0, -OUTER_RADIUS - 2)
  marker.closePath()
  marker.fill({ color: COLORS.gold })
  root.addChild(marker)
}

export function centerWheelScene(scene: WheelScene, size: number): void {
  scene.root.x = size / 2
  scene.root.y = size / 2
}