/**
 * dsh-status-indication — sound synthesis module.
 *
 * Uses Web Audio API (OscillatorNode + GainNode) to synthesise short
 * notification sounds with zero external dependencies.
 *
 * All playback functions are async and silently catch errors — the most
 * common cause is the browser's autoplay policy blocking audio after the
 * tab has been idle for a long time, which is a graceful degradation.
 */

/** Lazily-created, shared AudioContext. */
let _ctx = null

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return _ctx
}

/**
 * Play a short high-frequency "ding" — attention-grabbing, suitable for
 * "someone needs you" notifications.
 */
async function ding() {
  const ctx = getCtx()
  await ctx.resume()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.06)
  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.2)
}

/**
 * Play a low gentle "dong" — satisfying completion tone, suitable for
 * "task finished" notifications.
 */
async function dong() {
  const ctx = getCtx()
  await ctx.resume()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(520, ctx.currentTime)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.35)
}

/**
 * Play a two-tone ascending chime — a pleasant "ding-dong" that works for
 * either notification type.
 */
async function chime() {
  const ctx = getCtx()
  await ctx.resume()

  const now = ctx.currentTime

  // First tone (higher)
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(880, now)
  gain1.gain.setValueAtTime(0.25, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
  osc1.start(now)
  osc1.stop(now + 0.15)

  // Second tone (lower)
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(660, now + 0.12)
  gain2.gain.setValueAtTime(0.001, now + 0.12)
  gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.14)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
  osc2.start(now + 0.12)
  osc2.stop(now + 0.35)
}

/** Sound definitions keyed by id. */
export const SOUNDS = {
  none: null,
  ding,
  dong,
  chime,
}

/** Valid sound ids. */
export const SOUND_IDS = ['none', 'ding', 'dong', 'chime']

/**
 * Play a sound by id.  Returns a promise that resolves when the sound
 * finishes (or immediately for 'none').  Errors are silently swallowed —
 * the browser's autoplay policy may deny playback and that's fine.
 */
export async function playSound(id) {
  const fn = SOUNDS[id]
  if (!fn) return
  try {
    await fn()
  } catch {
    // Silently ignore — audio is best-effort.
  }
}