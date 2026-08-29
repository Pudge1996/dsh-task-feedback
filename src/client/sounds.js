/**
 * dsh-status-indication — sound synthesis module.
 *
 * Uses Web Audio API (OscillatorNode + GainNode + effects) to synthesise
 * notification sounds from Patch recipes with zero external dependencies.
 *
 * The sound catalogue is defined in procedural-patches.js — add or remove
 * entries there to change the available sounds.
 *
 * All playback functions are async and silently catch errors — the most
 * common cause is the browser's autoplay policy blocking audio after the
 * tab has been idle for a long time, which is a graceful degradation.
 */

import { playPatch } from './synth-core/synth.js'
import { PATCHES } from './procedural-patches.js'

/**
 * Sound playback functions keyed by id.
 * 'none' is null (no-op); each patch entry wraps playPatch for its recipe.
 */
export const SOUNDS = Object.fromEntries([
  ['none', null],
  ...PATCHES.map((p) => [p.id, () => playPatch(p.patch)]),
])

/** Valid sound ids — derived from PATCHES. */
export const SOUND_IDS = ['none', ...PATCHES.map((p) => p.id)]

/**
 * Play a sound by id.  Returns a promise that resolves when the sound
 * finishes (or immediately for 'none').  Errors are silently swallowed —
 * the browser's autoplay policy may deny playback and that's fine.
 *
 * @param {string} id
 * @returns {Promise<void>}
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