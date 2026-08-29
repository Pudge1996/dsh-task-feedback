/**
 * Recipe player — turns a Patch into Web Audio nodes.
 *
 * Adapted from procedural-sounds (https://github.com/m1ckc3s/procedural-sounds),
 * lib/audio/synth.ts. MIT license.
 *
 * Upstream credit: adapted from @web-kits/audio (Raphael Salaja, MIT).
 */

import { ensureReady, getContext, getDestination } from './context.js'
import { createReverb, createShimmer, shimmerTail } from './effects.js'
import { layersOf } from './patch.js'

const SILENCE = 0.0001

// ── noise generators ────────────────────────────────────────────────

function generateWhiteNoise(data) {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1
  }
}

function generatePinkNoise(data) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }
}

function generateBrownNoise(data) {
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
}

function createNoiseBuffer(ctx, color, duration) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  if (color === 'pink') generatePinkNoise(data)
  else if (color === 'brown') generateBrownNoise(data)
  else generateWhiteNoise(data)
  return buffer
}

// ── source builders ─────────────────────────────────────────────────

function buildNoiseSource(ctx, src, t, duration) {
  const node = ctx.createBufferSource()
  node.buffer = createNoiseBuffer(ctx, src.color ?? 'white', duration + 0.1)
  node.start(t)
  node.stop(t + duration + 0.1)
  return node
}

function buildOscillatorSource(ctx, src, t, duration) {
  const osc = ctx.createOscillator()
  osc.type = src.type

  if (typeof src.frequency === 'number') {
    osc.frequency.setValueAtTime(src.frequency, t)
  } else {
    osc.frequency.setValueAtTime(src.frequency.start, t)
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(src.frequency.end, 1),
      t + Math.min(src.frequency.time ?? duration, duration),
    )
  }

  if (src.detune) {
    osc.detune.value = src.detune
  }

  // FM
  if (src.fm) {
    const carrierFreq =
      typeof src.frequency === 'number' ? src.frequency : src.frequency.start
    const fmMod = ctx.createOscillator()
    fmMod.type = 'sine'
    fmMod.frequency.value = carrierFreq * src.fm.ratio
    const modGain = ctx.createGain()
    modGain.gain.value = src.fm.depth
    fmMod.connect(modGain)
    modGain.connect(osc.frequency)
    fmMod.start(t)
    fmMod.stop(t + duration + 0.1)
  }

  osc.start(t)
  osc.stop(t + duration + 0.1)
  return osc
}

function buildSource(ctx, src, t, duration) {
  return src.type === 'noise'
    ? buildNoiseSource(ctx, src, t, duration)
    : buildOscillatorSource(ctx, src, t, duration)
}

// ── envelope ─────────────────────────────────────────────────────────

function buildEnvelope(ctx, envelope, gain, t) {
  const node = ctx.createGain()

  if (!envelope) {
    node.gain.setValueAtTime(gain, t)
    node.gain.setTargetAtTime(SILENCE, t, 0.15)
    return { node, duration: 0.5 }
  }

  const attack = envelope.attack ?? 0
  const decay = envelope.decay
  const sustain = envelope.sustain ?? 0
  const release = envelope.release ?? 0
  const sustainLevel = Math.max(sustain * gain, SILENCE)
  const decayTC = decay / 3

  if (envelope.curve === 'ramp') {
    const peak = Math.max(gain, SILENCE)
    node.gain.setValueAtTime(SILENCE, t)
    if (attack > 0) {
      node.gain.exponentialRampToValueAtTime(peak, t + attack)
    } else {
      node.gain.setValueAtTime(peak, t)
    }
    node.gain.exponentialRampToValueAtTime(SILENCE, t + attack + decay)
    return { node, duration: attack + decay + release }
  }

  node.gain.setValueAtTime(SILENCE, t)

  if (attack > 0) {
    node.gain.linearRampToValueAtTime(gain, t + attack)
  } else {
    node.gain.setValueAtTime(gain, t)
  }

  if (sustain > 0) {
    node.gain.setTargetAtTime(sustainLevel, t + attack, decayTC)
    if (release > 0) {
      node.gain.setTargetAtTime(SILENCE, t + attack + decay, release / 3)
    }
  } else {
    node.gain.setTargetAtTime(SILENCE, t + attack, decayTC)
  }

  return { node, duration: attack + decay + release }
}

// ── filter ───────────────────────────────────────────────────────────

function buildFilter(ctx, filter, t) {
  const node = ctx.createBiquadFilter()
  node.type = filter.type
  node.frequency.setValueAtTime(filter.frequency, t)
  node.Q.value = filter.Q ?? filter.resonance ?? 1

  if (filter.envelope) {
    const env = filter.envelope
    const attackEnd = t + (env.attack ?? 0)
    node.frequency.linearRampToValueAtTime(env.peak, attackEnd)
    node.frequency.exponentialRampToValueAtTime(
      Math.max(filter.frequency, 1),
      attackEnd + env.decay,
    )
  }

  return node
}

// ── public API ───────────────────────────────────────────────────────

/**
 * Compute the total duration of a patch in seconds.
 * @param {import('./patch.js').Patch} patch
 * @returns {number}
 */
export function patchDuration(patch) {
  const durations = layersOf(patch).map((layer) => {
    const env = layer.envelope
    const envDur = env ? (env.attack ?? 0) + env.decay + (env.release ?? 0) : 0.5
    const fxTail = (layer.effects ?? []).reduce(
      (max, e) =>
        e.type === 'reverb'
          ? Math.max(max, e.decay ?? 0.5)
          : e.type === 'delay'
            ? Math.max(max, shimmerTail(e))
            : max,
      0,
    )
    return (layer.delay ?? 0) + envDur + fxTail
  })
  return Math.max(...durations) + 0.15
}

/**
 * Build the full Web Audio node graph for a patch and schedule playback.
 * Returns a handle with { duration, stop() }.
 *
 * @param {BaseAudioContext} ctx
 * @param {import('./patch.js').Patch} patch
 * @param {{volume?:number, detune?:number, jitter?:{detune?:number, volume?:number}}} [opts]
 * @param {number} [baseTime]
 * @param {AudioNode} [destination]
 * @returns {{duration:number, stop:(releaseTime?:number)=>void}}
 */
export function renderPatch(ctx, patch, opts, baseTime, destination) {
  const dest = destination ?? ctx.destination
  const t0 = baseTime ?? ctx.currentTime

  const jitter = opts?.jitter
  const detuneJitter = jitter?.detune ? (Math.random() * 2 - 1) * jitter.detune : 0
  const volumeJitter = jitter?.volume ? 1 + (Math.random() * 2 - 1) * jitter.volume : 1

  const allSourceNodes = []
  const allEnvNodes = []

  for (const layer of layersOf(patch)) {
    const layerStart = t0 + (layer.delay ?? 0)
    const baseGain = (layer.gain ?? 0.5) * (opts?.volume ?? 1) * volumeJitter

    const { node: envNode, duration: envDuration } = buildEnvelope(
      ctx, layer.envelope, baseGain, layerStart,
    )
    allEnvNodes.push(envNode)

    const srcNode = buildSource(ctx, layer.source, layerStart, envDuration)
    if (srcNode instanceof OscillatorNode && (opts?.detune || detuneJitter !== 0)) {
      srcNode.detune.value += (opts?.detune ?? 0) + detuneJitter
    }

    let tail = srcNode
    const filterNodes = []
    const filters = layer.filter
      ? Array.isArray(layer.filter) ? layer.filter : [layer.filter]
      : []
    for (const f of filters) {
      const fn = buildFilter(ctx, f, layerStart)
      tail.connect(fn)
      tail = fn
      filterNodes.push(fn)
    }

    tail.connect(envNode)

    let cursor = envNode
    for (const effect of layer.effects ?? []) {
      const fx =
        effect.type === 'reverb'
          ? createReverb(ctx, effect)
          : effect.type === 'delay'
            ? createShimmer(ctx, effect)
            : null
      if (!fx) continue
      cursor.connect(fx.input)
      cursor = fx.output
    }
    cursor.connect(dest)

    allSourceNodes.push(srcNode)
    const nodesToDisconnect = [srcNode, envNode, ...filterNodes]
    srcNode.onended = () => {
      for (const n of nodesToDisconnect) {
        try { n.disconnect() } catch { /* already disconnected */ }
      }
    }
  }

  return {
    duration: patchDuration(patch),
    stop(releaseTime) {
      const now = ctx.currentTime
      const fade = releaseTime ?? 0.015
      for (const env of allEnvNodes) {
        env.gain.cancelScheduledValues(now)
        env.gain.setValueAtTime(env.gain.value, now)
        env.gain.setTargetAtTime(SILENCE, now, fade / 3)
      }
      for (const src of allSourceNodes) {
        try { src.stop(now + fade + 0.05) } catch { /* already stopped */ }
      }
    },
  }
}

/**
 * Play a patch on the live AudioContext.  Resumes the context first if
 * needed (autoplay policy).
 *
 * @param {import('./patch.js').Patch} patch
 * @param {{volume?:number, detune?:number, jitter?:{detune?:number, volume?:number}}} [opts]
 * @returns {Promise<{duration:number, stop:(releaseTime?:number)=>void}>}
 */
export async function playPatch(patch, opts) {
  const ctx = getContext().state === 'running' ? getContext() : await ensureReady()
  return renderPatch(ctx, patch, opts, undefined, getDestination())
}