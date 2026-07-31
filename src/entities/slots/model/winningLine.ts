/**
 * Which reels form the payline's winning combination — for the highlight only.
 * What a spin actually pays is decided by the server.
 */
export function getWinningLine(reels: string[]): number[] {
  let best: number[] = []

  for (const symbol of new Set(reels)) {
    const matches = reels.flatMap((reel, index) => (reel === symbol ? [index] : []))
    if (matches.length > best.length) best = matches
  }

  return best.length >= 2 ? best : []
}
