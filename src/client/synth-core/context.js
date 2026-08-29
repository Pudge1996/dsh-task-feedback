/**
 * AudioContext singleton — shared by all sound synthesis.
 *
 * Adapted from procedural-sounds (https://github.com/m1ckc3s/procedural-sounds),
 * lib/audio/context.ts. MIT license.
 */

/** @type {AudioContext|null} */
let ctx = null

/**
 * Return the shared AudioContext, creating it on first call.
 * Automatically resumes a suspended context.
 * @returns {AudioContext}
 */
export function getContext() {
  if (!ctx || ctx.state === 'closed') {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

/**
 * Ensure the context is running (wait for resume if suspended).
 * @returns {Promise<AudioContext>}
 */
export async function ensureReady() {
  const audio = getContext()
  if (audio.state === 'suspended') {
    await audio.resume()
  }
  return audio
}

/**
 * Return the destination node (context.destination).
 * @returns {AudioNode}
 */
export function getDestination() {
  return getContext().destination
}