/**
 * dsh-status-indication — client half.
 *
 * When the browser tab is hidden AND the user is inside a session page
 * (detected via document.title containing " — " per DSH's DocumentTitle
 * convention), replaces the favicon with a coloured indicator matching the
 * current session's status so you can glance at the tab bar and know what's
 * happening:
 *   green  — a running task finished while you were away
 *   blue   — running (agent or subagent)
 *   amber  — waiting for approval, plan review, or question answer
 *
 * The indicator is a *change notification*, not a live status mirror.  When
 * the session was already terminal (idle / completed) at the moment the tab
 * was hidden, no indicator is shown — there is nothing new to report.
 *
 * When the tab is visible again, or on the welcome page, the original
 * favicon is restored immediately.
 *
 * Sound notifications: when the tab is hidden, a state transition to
 * warning or done can trigger a short synthesised sound — configurable
 * independently in the Settings section.
 *
 * Settings section: registers a "Status" section in the Settings side panel
 * that lets the user pick one of three indicator shapes
 * (dot, solid-dot, rect) and two sound effects (warning / done). All
 * choices are persisted to localStorage and take effect immediately.
 */

import { StatusIndicatorSection, readSoundWarning, readSoundDone } from './StatusIndicatorSection.js'
import { playSound } from './sounds.js'
import { en, zh } from './locales.js'

// StateDot states as defined in @deepseek-ai/dsh-client-ui-primitives StateDot.tsx
// done | warning | ongoing | error

/** Dictionary namespace for the settings section. */
const NS = 'settings.statusIndicator'

const STYLE_KEY = 'dsh-status-indication:style'
const STYLES = ['dot', 'solid-dot', 'rect']

/** Read the persisted favicon style, defaulting to 'dot'. */
function readStyle() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STYLE_KEY) : null
  return STYLES.includes(raw) ? raw : 'dot'
}

/** Resolve a CSS custom property to an "R, G, B" string.
 *  Returns null when the DOM isn't ready or the variable is missing. */
function readCssVar(name) {
  if (!document.documentElement) return null
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!raw) return null
  const m = raw.match(/[\d.]+/g)
  if (!m) return null
  if (m[0] === '0' && m[1] === '0' && m[2] === '0') return null
  return m.slice(0, 3).join(', ')
}

/** Lazily resolved colours — memoised on first indicatorSvg call. */
let _colors = null
function getColors() {
  if (_colors) return _colors
  _colors = {
    done:    '41, 199, 65',  // green — hardcoded #29C741
    warning: readCssVar('--dsw-alias-state-warn-primary')     ?? '252, 136, 0',
    ongoing: readCssVar('--dsw-alias-state-business-primary') ?? '0, 100, 250',
  }
  return _colors
}

/** Build an inline SVG data URI for the given state and style.
 *
 *  Styles:
 *    dot          — small double-circle (outer ring at 0.2 opacity, inner r=8)
 *    solid-dot    — single solid circle filling the 32×32 viewBox
 *    rect         — rounded rectangle (rx=6) filling the 32×32 viewBox
 */
function indicatorSvg(state, style) {
  const c = getColors()[state] ?? getColors().done
  let body

  switch (style) {
    case 'solid-dot':
      body = `<circle cx="16" cy="16" r="16" fill="rgb(${c})" />`
      break
    case 'rect':
      body = `<rect x="0" y="0" width="32" height="32" rx="6" fill="rgb(${c})" />`
      break
    default: { // 'dot'
      const innerR = state === 'done' ? 9 : 8
      body = `<circle cx="16" cy="16" r="16" fill="rgba(${c},0.2)" />
  <circle cx="16" cy="16" r="${innerR}" fill="rgb(${c})" />`
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  ${body}
</svg>`

  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/**
 * Count running subagent descendants reachable from `sessionId` through an
 * uninterrupted subagent-origin chain. Mirrors the pure logic in
 * indexSubagentDescendants (subagent-lineage.ts): walks every session in
 * `byId` whose origin is 'subagent', follows parentId links, and counts how
 * many reach `sessionId` and are currently running.
 */
function countRunningSubagents(sessionId, byId) {
  let count = 0
  for (const descendant of Object.values(byId)) {
    if (descendant.origin !== 'subagent') continue
    if (!descendant.running) continue
    const seen = new Set()
    let current = descendant
    while (current && current.origin === 'subagent' && current.parentId !== undefined
      && !seen.has(current.id)) {
      seen.add(current.id)
      if (current.parentId === sessionId) { count++; break }
      current = byId[current.parentId]
    }
  }
  return count
}

/**
 * Derive the StateDot state from a SessionSummary using the same priority
 * logic as the sidebar's sessionStatuses() in Rows.tsx:
 *   pending interaction   → warning
 *   running               → ongoing
 *   running subagents > 0 → ongoing
 *   completed             → done
 *   default (idle)        → done
 */
function deriveState(session, runningSubagentCount, pending) {
  if (pending)                      return 'warning'
  if (session.running)             return 'ongoing'
  if (runningSubagentCount > 0)    return 'ongoing'
  // completed is true when the session finished running while not selected
  return 'done'
}

export const inject = ['sessions', 'uiSession', 'slots', 'locale']

const SETTINGS_CSS =
  '.dsh-si-row{display:flex;align-items:center;gap:8px;padding:16px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}' +
  '.dsh-si-heading{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px;padding-top:20px}' +
  '.dsh-si-heading:first-child{padding-top:0}' +
  '.dsh-si-rowText{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;padding-right:48px}' +
  '.dsh-si-title{font-size:14px;font-weight:400;line-height:22px;color:var(--dsw-alias-label-primary)}' +
  '.dsh-si-desc{font-size:12px;font-weight:400;line-height:18px;color:var(--dsw-alias-label-tertiary)}' +
  '.dsh-si-selector{display:inline-flex;align-items:center;gap:12px;height:36px;padding:0 14px;' +
    'border:none;border-radius:18px;background:var(--dsw-alias-bg-module-platform);' +
    'font:inherit;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary);cursor:pointer}' +
  '.dsh-si-selector:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}' +
  '.dsh-si-selector:disabled{cursor:default}' +
  '.dsh-si-chevron{flex:none}'

export function apply(ctx) {
  const link = document.querySelector('link[rel="icon"]')
  if (!link) return // no favicon element to update

  const originalHref = link.href

  // Register locale dictionaries for the settings section.
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'status-indication: dictionaries')

  // Inject segmented-control styles.
  const styleEl = document.createElement('style')
  styleEl.id = 'dsh-status-indication-settings-style'
  styleEl.textContent = SETTINGS_CSS
  ;(document.head || document.documentElement).appendChild(styleEl)

  // Contribute the "Status" section to the Settings side panel.
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'status-indication',
    order: 20,
    label: () => t('nav'),
    locale: NS,
  }, () => StatusIndicatorSection({ t })))

  /**
   * The session's derived state at the moment the tab was hidden.
   * `undefined` means no baseline has been captured (tab is visible or
   * never hidden).  Used to implement change-notification semantics:
   * only sessions that were *not* terminal at hide time produce an indicator.
   */
  let baseline = undefined

  /**
   * The previous derived state, used to detect transitions for sound
   * playback.  Reset to `undefined` when the tab becomes visible so that
   * the first state change after re-hiding fires sounds again.
   */
  let previousDerived = undefined

  /**
   * Whether the current session has a pending user interaction.
   * From 0.1.2 alpha, `pendingInteraction` was removed from SessionSummary
   * and moved to a separate `ctx.uiSession.pendingInteractions` Map.
   * SessionSummary snapshots are frozen — we read the pending flag as a
   * local variable rather than trying to mutate the frozen object.
   */
  function pendingFor(state) {
    // Old API: pendingInteraction is a boolean on SessionSummary itself.
    if ('pendingInteraction' in (state.byId[state.current] ?? {})) {
      return !!state.byId[state.current].pendingInteraction
    }
    // New API (0.1.2 alpha+): query the separate pendingInteractions Map.
    return ctx.uiSession.pendingInteractions.getSnapshot().has(state.current)
  }

  /** Capture the current session's derived state; returns null when not on a session page. */
  function currentDerived(list) {
    if (!document.title.includes(' — ')) return null
    const state = list.getSnapshot()
    const session = state.current ? state.byId[state.current] : undefined
    if (!session) return null
    const runningSubs = countRunningSubagents(state.current, state.byId)
    return deriveState(session, runningSubs, pendingFor(state))
  }

  // Compute the indicator favicon href for the current session state, or null
  // when there is no active session, we're on the welcome page, or the
  // baseline was terminal (no change to report).
  // DSH's DocumentTitle sets session pages as "${title} — ${productTitle}",
  // while the welcome page is just the product title (no " — " separator).
  function indicatorForCurrent(list) {
    const s = currentDerived(list)
    if (s === null) return null
    // If the baseline was terminal (done), the session was already idle or
    // completed when the user switched away — nothing new to report.
    if (baseline === 'done') return null
    // Exception: pending interaction always overrides the baseline guard.
    // If the user was asked a question before switching away, keep the
    // amber indicator even after they return to a terminal state.
    const style = readStyle()
    if (baseline === 'warning') return s === 'ongoing' ? indicatorSvg('ongoing', style) : indicatorSvg('warning', style)
    return indicatorSvg(s, style)
  }

  /**
   * Check for state transitions and play the appropriate sound.
   * Only fires when the tab is hidden and the derived state actually changes.
   */
  function handleSound(list) {
    if (!document.hidden) return
    const current = currentDerived(list)
    if (current === null) return
    if (current === previousDerived) return

    previousDerived = current

    if (current === 'warning') {
      const soundId = readSoundWarning()
      if (soundId !== 'none') playSound(soundId)
    } else if (current === 'done') {
      const soundId = readSoundDone()
      if (soundId !== 'none') playSound(soundId)
    }
  }

  // Apply the correct favicon based on current visibility + session state.
  function refresh(list) {
    if (document.hidden) {
      const href = indicatorForCurrent(list) ?? originalHref
      if (link.href !== href) link.href = href
    } else {
      if (link.href !== originalHref) link.href = originalHref
    }
    handleSound(list)
  }

  ctx.effect(() => {
    const list = ctx.sessions.list

    refresh(list)
    const unsubSessions = list.subscribe(() => refresh(list))
    const unsubPending = ctx.uiSession.pendingInteractions.subscribe(() => refresh(list))

    function onVisibilityChange() {
      if (document.hidden) {
        // Capture the baseline at the instant the tab is hidden.
        baseline = currentDerived(list)
        // Seed the previous-derived tracker so the first sound only fires
        // on a genuine state change after hiding.
        previousDerived = baseline
      } else {
        // Clear the baseline and sound tracker when the tab becomes visible.
        baseline = undefined
        previousDerived = undefined
      }
      refresh(list)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      unsubSessions()
      unsubPending()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (link.href !== originalHref) link.href = originalHref
    }
  })
}