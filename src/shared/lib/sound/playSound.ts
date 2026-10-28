import { useSoundSettings } from './soundSettings'

/*
 * Every sound is synthesised with Web Audio rather than loaded from files: no
 * assets to fetch before the first chip can click, nothing to cache-bust, and a
 * few hundred bytes of code instead of a few hundred kilobytes of audio.
 */

export type SoundName = 'chip' | 'ball' | 'reels' | 'win'

interface PlayOptions {
  /** For sounds that last as long as an animation: the ball's orbit, the reels' turn. */
  durationMs?: number
}

let context: AudioContext | null = null
let master: GainNode | null = null

/**
 * Plays `name` at the current volume, or not at all when muted. Never throws:
 * a browser without Web Audio, or one still waiting for a gesture, just stays quiet.
 */
export function playSound(name: SoundName, { durationMs = 0 }: PlayOptions = {}): void {
  const { muted, volume } = useSoundSettings.getState()
  if (muted || volume === 0) return

  const audio = getContext()
  if (!audio || !master) return

  // Squared, because loudness is not linear: half way along the slider should sound half as loud.
  master.gain.setValueAtTime(volume * volume, audio.currentTime)
  const at = audio.currentTime + 0.01

  if (name === 'chip') chip(audio, master, at)
  else if (name === 'ball') ball(audio, master, at, durationMs / 1000)
  else if (name === 'reels') reels(audio, master, at, durationMs / 1000)
  else win(audio, master, at)
}

function getContext(): AudioContext | null {
  if (context) {
    // Created outside a gesture, the context starts suspended; any later play retries.
    if (context.state === 'suspended') void context.resume().catch(() => undefined)
    return context
  }
  if (typeof AudioContext === 'undefined') return null

  try {
    context = new AudioContext()
    master = context.createGain()
    master.connect(context.destination)
  } catch {
    return null
  }
  return context
}

/* Browsers only let audio start from a user gesture; the first tap anywhere unlocks it. */
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => void context?.resume().catch(() => undefined), {
    once: true,
    passive: true,
  })
}

/* A short pitched blip with a fast decay — the building block for clicks and ticks. */
function blip(
  audio: AudioContext,
  out: AudioNode,
  at: number,
  frequency: number,
  length: number,
  level: number,
  type: OscillatorType = 'triangle',
): void {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, at)
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain).connect(out)
  osc.start(at)
  osc.stop(at + length + 0.02)
}

/* Two clay chips touching. */
function chip(audio: AudioContext, out: AudioNode, at: number): void {
  blip(audio, out, at, 2400, 0.05, 0.35)
  blip(audio, out, at + 0.035, 1900, 0.06, 0.25)
}

/* The ball clattering over the frets, slowing as the wheel does. */
function ball(audio: AudioContext, out: AudioNode, at: number, duration: number): void {
  if (duration <= 0) return
  let t = 0
  let gap = 0.05
  while (t < duration) {
    blip(audio, out, at + t, 3200 + Math.random() * 600, 0.025, 0.12, 'square')
    t += gap
    gap *= 1.045
  }
}

/* Reel stops ticking past the window, evenly, for as long as the reels turn. */
function reels(audio: AudioContext, out: AudioNode, at: number, duration: number): void {
  for (let t = 0; t < duration; t += 0.07) {
    blip(audio, out, at + t, 900, 0.03, 0.1, 'square')
  }
}

/* A rising major arpeggio. */
function win(audio: AudioContext, out: AudioNode, at: number): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((frequency, index) => {
    blip(audio, out, at + index * 0.09, frequency, 0.35, 0.3)
  })
}
