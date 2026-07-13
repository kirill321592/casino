import { WHEEL_ORDER } from '@/entities/wheel/model/wheelLayout'

export function pickRandomPocket(): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return WHEEL_ORDER[array[0] % WHEEL_ORDER.length]!
}
