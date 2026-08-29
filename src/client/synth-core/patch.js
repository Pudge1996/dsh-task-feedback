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

/**
 * @typedef {'sine'|'triangle'|'square'|'sawtooth'} Waveform
 *
 * @typedef {number|{start:number, end:number, time?:number}} Frequency
 *
 * @typedef {{ratio:number, depth:number}} FM
 *
 * @typedef {{type:Waveform, frequency:Frequency, fm?:FM, detune?:number}} OscillatorSource
 *
 * @typedef {'white'|'pink'|'brown'} NoiseColor
 *
 * @typedef {{type:'noise', color?:NoiseColor}} NoiseSource
 *
 * @typedef {OscillatorSource|NoiseSource} Source
 *
 * @typedef {{attack?:number, decay:number, sustain?:number, release?:number, curve?:'ramp'}} Envelope
 *
 * @typedef {{attack?:number, peak:number, decay:number}} FilterEnvelope
 *
 * @typedef {{type:BiquadFilterType, frequency:number, Q?:number, resonance?:number, envelope?:FilterEnvelope}} Filter
 *
 * @typedef {{type:'reverb', decay?:number, damping?:number, mix?:number, preDelay?:number, roomSize?:number}} ReverbEffect
 *
 * @typedef {{type:'delay', delay:number, feedback:number, wet:number, lowpass?:number}} DelayEffect
 *
 * @typedef {ReverbEffect|DelayEffect} Effect
 *
 * @typedef {{source:Source, envelope?:Envelope, gain?:number, delay?:number, filter?:Filter|Filter[], effects?:Effect[]}} Layer
 *
 * @typedef {Layer|{layers:Layer[]}} Patch
 */