import { useRouletteStore, type RouletteStore } from '@/entities/roulette/model/rouletteStore'

/** Stable for the life of the store, so this subscribes to nothing that moves. */
export function usePlaceBet() {
  return useRouletteStore((store) => store.placeBet)
}

/**
 * The table takes bets whenever the round is open and no wheel is turning — the
 * previous result staying on screen does not close it. The server opens the next
 * round before the wheel stops, so waiting for the overlay to be dismissed would
 * quietly cost the player seconds off a window they never see start.
 *
 * A selector rather than a hook body: it returns a boolean, so the buttons wake
 * when the table opens or closes and not once per bet placed at it.
 */
export function canPlaceBets(store: RouletteStore): boolean {
  return store.connected && store.phase !== 'spinning' && store.round?.status === 'betting'
}
