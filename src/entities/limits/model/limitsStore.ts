import { create } from 'zustand'
import { fetchLimits, updateLimits, type LimitsUpdate, type PlayLimits } from '@/shared/api/account'

interface LimitsStore {
  /** Null until the first load lands. */
  limits: PlayLimits | null
  /** Fetches the limits in force. Safe to call again — the latest answer wins. */
  load: () => Promise<void>
  /** Saves a change and keeps what the server says took effect, which may be less than asked. */
  save: (update: LimitsUpdate) => Promise<PlayLimits>
  /** Forgets the previous account's limits on sign-out. */
  clear: () => void
}

/*
 * Shared by the responsible-gaming page, which edits the limits, and the reality
 * check, which runs on one of them — so a new interval applies without a reload.
 */
export const useLimitsStore = create<LimitsStore>((set) => ({
  limits: null,
  load: async () => set({ limits: await fetchLimits() }),
  save: async (update) => {
    const limits = await updateLimits(update)
    set({ limits })
    return limits
  },
  clear: () => set({ limits: null }),
}))
