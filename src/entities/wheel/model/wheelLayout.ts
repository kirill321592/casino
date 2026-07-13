/** European roulette pocket order (clockwise from 0). */
export const WHEEL_ORDER: readonly number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

export const POCKET_COUNT = WHEEL_ORDER.length
export const SEGMENT_ANGLE = (Math.PI * 2) / POCKET_COUNT

export type PocketColor = 'green' | 'red' | 'black'

export function getPocketColor(number: number): PocketColor {
  if (number === 0) return 'green'
  return RED_NUMBERS.has(number) ? 'red' : 'black'
}

export function getPocketIndex(number: number): number {
  const index = WHEEL_ORDER.indexOf(number)
  if (index === -1) throw new Error(`Invalid pocket number: ${number}`)
  return index
}

export function isEven(number: number): boolean {
  return number !== 0 && number % 2 === 0
}

export function isOdd(number: number): boolean {
  return number !== 0 && number % 2 === 1
}
