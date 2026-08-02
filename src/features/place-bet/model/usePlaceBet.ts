import { useRouletteStore, type RouletteStore } from '@/entities/roulette/model/rouletteStore'

/** Stable for the life of the store, so this subscribes to nothing that moves. */
export function usePlaceBet() {
  return useRouletteStore((store) => store.placeBet)
}

/**
 * The table takes bets only while the round is open and no wheel is turning.
 * A selector rather than a hook body: it returns a boolean, so the buttons wake
 * when the table opens or closes and not once per bet placed at it.
 */
export function canPlaceBets(store: RouletteStore): boolean {
  return store.connected && store.phase === 'idle' && store.round?.status === 'betting'
}
