/**
 * Patch type definitions — the sound recipe format.
 *
 * Adapted from procedural-sounds (https://github.com/m1ckc3s/procedural-sounds),
 * lib/audio/patch.ts. MIT license.
 *
 * A Patch is either a single Layer or { layers: Layer[] }.
 * A Layer describes one voice: source → filter → envelope → effects.
 */

/**
 * Flatten a Patch into an array of Layers.
 * @param {Patch} patch
 * @returns {Layer[]}
 */
export function layersOf(patch) {
  return 'layers' in patch ? patch.layers : [patch]
}

