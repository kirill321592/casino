import { create } from 'zustand'

/*
 * Per device rather than per account: whether a laptop in an office should make
 * noise is not a fact about the player. So localStorage, not the server.
 */
const KEY = 'casino:sound'
const DEFAULT_VOLUME = 0.6

interface SoundSettings {
  muted: boolean
  /** 0–1. Kept while muted, so unmuting comes back at the same level. */
  volume: number
  setMuted: (muted: boolean) => void
  setVolume: (volume: number) => void
}

export const useSoundSettings = create<SoundSettings>((set) => ({
  ...readStored(),
  setMuted: (muted) => {
    // Unmuting a slider left at zero would change nothing anyone could hear.
    set((state) => ({
      muted,
      volume: !muted && state.volume === 0 ? DEFAULT_VOLUME : state.volume,
    }))
    persist()
  },
  setVolume: (volume) => {
    // Dragging the slider up from silence is a request to hear something.
    set({ volume: Math.min(1, Math.max(0, volume)), muted: volume === 0 })
    persist()
  },
}))

function persist(): void {
  const { muted, volume } = useSoundSettings.getState()
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, muted, volume }))
  } catch {
    // Private mode or blocked storage: the setting lasts as long as the page.
  }
}

function readStored(): Pick<SoundSettings, 'muted' | 'volume'> {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null') as {
      v?: number
      muted?: unknown
      volume?: unknown
    } | null
    if (stored?.v === 1 && typeof stored.muted === 'boolean' && typeof stored.volume === 'number') {
      return { muted: stored.muted, volume: Math.min(1, Math.max(0, stored.volume)) }
    }
  } catch {
    // Unreadable or blocked — fall through to the defaults.
  }
  return { muted: false, volume: DEFAULT_VOLUME }
}
