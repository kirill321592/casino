import { REEL_COUNT, SLOT_SYMBOLS, type SlotSymbolDef } from './symbols'

const TOTAL_WEIGHT = SLOT_SYMBOLS.reduce((sum, entry) => sum + entry.weight, 0)

function pickSymbol(): SlotSymbolDef {
  let roll = Math.random() * TOTAL_WEIGHT
  for (const entry of SLOT_SYMBOLS) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1]
}

export function spinReels(): string[] {
  return Array.from({ length: REEL_COUNT }, () => pickSymbol().symbol)
}

export function calcPayout(reels: string[], bet: number): number {
  const counts = new Map<string, number>()
  for (const symbol of reels) counts.set(symbol, (counts.get(symbol) ?? 0) + 1)

  let best = 0
  for (const [symbol, count] of counts) {
    const def = SLOT_SYMBOLS.find((entry) => entry.symbol === symbol)
    if (!def || count < 2) continue
    const multiplier = count >= 3 ? def.payout3 : def.payout2
    best = Math.max(best, multiplier * bet)
  }
  return best
}
