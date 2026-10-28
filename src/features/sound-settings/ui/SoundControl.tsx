import { useSoundSettings } from '@/shared/lib/sound'

/* Mute and volume, remembered on this device. Lives in the game header, next to the balance. */
export function SoundControl() {
  const muted = useSoundSettings((store) => store.muted)
  const volume = useSoundSettings((store) => store.volume)
  const setMuted = useSoundSettings((store) => store.setMuted)
  const setVolume = useSoundSettings((store) => store.setVolume)
  const silent = muted || volume === 0

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setMuted(!muted)}
        aria-pressed={silent}
        aria-label={silent ? 'Unmute sound' : 'Mute sound'}
        className="grid size-9 place-items-center rounded-full border border-slate-400/25 bg-surface/90 text-base transition-colors hover:border-gold/50"
      >
        <span aria-hidden>{silent ? '🔇' : '🔊'}</span>
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round((muted ? 0 : volume) * 100)}
        onChange={(event) => setVolume(Number(event.target.value) / 100)}
        aria-label="Volume"
        aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`}
        className="w-20 accent-gold max-sm:hidden"
      />
    </div>
  )
}
