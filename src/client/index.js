/**
 * dsh-task-feedback — client half.
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
 * Sound notifications: configurable per event (warning / done) with a
 * global sound-scope setting that controls when sounds play — only while the
 * page is away from the user (tab hidden *or* window unfocused), or always
 * (even while you are looking at the page).
 *
 * Settings section: registers a "Feedback" section in the Settings side panel
 * that lets the user pick one of three indicator shapes
 * (dot, solid-dot, rect) and two sound effects (warning / done). All
 * choices are persisted to localStorage and take effect immediately.
 *
 * Host contract (two generation-dependent reads, both feature-detected):
 *   - the main-view Session id — `SessionListState.current` until
 *     0.1.6-alpha.2, then `uiSession.adapter.current` / `retainedBy.mainView`;
 *   - the pending interaction — `uiSession.pendingInteractions` until
 *     0.1.6-alpha.2, then `uiSession.sessionStatus`.
 * The icon surface is every `link[rel="icon"]`, because the shell qualifies
 * the static favicons with `media` since 0.1.7-alpha.1.
 */

import { FeedbackSection, readSoundWarning, readSoundDone, readSoundScope, readStyle } from './FeedbackSection.js'
import { playSound, soundLabelKey } from './sounds.js'
import { en, zh } from './locales.js'
import { PATCHES } from './procedural-patches.js'

// Augment locale dictionaries with patch sound labels.
for (const p of PATCHES) {
  const key = soundLabelKey(p.id)
  if (!zh[key]) zh[key] = p.label.zh
  if (!en[key]) en[key] = p.label.en
}

// StateDot states as defined in @deepseek-ai/dsh-client-ui-primitives StateDot.tsx
// done | warning | ongoing | error

/** Dictionary namespace for the settings section. */
const NS = 'settings.feedback'

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
  // From 0.1.7-alpha.1 the shell qualifies the static favicons with `media`
  // (a dark and a light link), so the indicator has to drive every
  // `link[rel="icon"]`, not just the first one.
  const icons = [...document.querySelectorAll('link[rel="icon"]')]
    .map((link) => ({ link, href: link.href }))
  if (icons.length === 0) return // no favicon element to update

  // Register locale dictionaries for the settings section.
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'feedback: dictionaries')

  // Inject segmented-control styles; the effect removes them on dispose so an
  // HMR reload does not stack duplicate style elements.
  ctx.effect(() => {
    const styleEl = document.createElement('style')
    styleEl.id = 'dsh-task-feedback-settings-style'
    styleEl.textContent = SETTINGS_CSS
    ;(document.head || document.documentElement).appendChild(styleEl)
    return () => { styleEl.remove() }
  }, 'feedback: settings styles')

  // Contribute the "Feedback" section to the Settings side panel.
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'feedback',
    order: 20,
    label: () => t('nav'),
    locale: NS,
  }, () => FeedbackSection({ t })))

  /**
   * The session's derived state at the moment the tab was hidden.
   * `undefined` means no baseline has been captured (tab is visible or
   * never hidden).  Used to implement change-notification semantics:
   * only sessions that were *not* terminal at hide time produce an indicator.
   */
  let baseline = undefined

  /**
   * The previous notification state, used to detect transitions for sound
   * playback.  Reset to `undefined` when the tab becomes visible so that
   * the first state change after re-hiding fires sounds again.
   */
  let previousNotification = undefined

  /**
   * The session id that `previousNotification` belongs to, used to
   * suppress spurious sounds when the user navigates between sessions
   * (session A's state is not a transition from session B's state).
   */
  let previousSessionId = undefined

  /**
   * Whether the browser window currently owns keyboard focus.
   *
   * The 'hidden' sound scope means "play while the user is away", and being
   * away is not only the Page Visibility API: switching to another application
   * (or another window) blurs this window while the tab stays *visible*.
   * `document.hasFocus()` seeds the initial value so a plugin mounting into an
   * already-unfocused window starts out correct; the window focus/blur events
   * keep it live afterwards.
   */
  let windowFocused = typeof document.hasFocus === 'function' ? document.hasFocus() : true

  /** True while the page is away from the user: hidden tab or unfocused window. */
  function isAway() {
    return document.hidden || !windowFocused
  }

  /**
   * Resolve the Session id the main view currently shows.
   *
   * 0.1.6-alpha.2 removed `SessionListState.current`: main-view occupancy is
   * now a per-source reference count (`SessionSummary.retainedBy.mainView`).
   * The slot-scope adapter's current binding carries the same fact on both
   * host generations, so read it first and fall back to the catalog marker.
   */
  function mainSessionId() {
    const binding = ctx.uiSession.adapter?.current?.getSnapshot?.()
    if (binding !== undefined && binding.key !== undefined) return binding.key
    const state = ctx.sessions.list.getSnapshot()
    return Object.values(state.byId).find((row) => (row.retainedBy?.mainView ?? 0) > 0)?.id
  }

  /**
   * The host's pending-interaction source.
   *
   * 0.1.2-alpha.1 exposed `uiSession.pendingInteractions`; 0.1.6-alpha.2
   * replaced it with the unified `uiSession.sessionStatus` snapshot, whose
   * `SessionStatus` carries `pendingInteraction` (plus `running` and
   * `completionUnread`). Normalize both to "does this session have a pending
   * interaction", so the plugin serves either host generation.
   * Returns null when neither source exists.
   */
  function pendingSource() {
    const sessionStatus = ctx.uiSession.sessionStatus
    if (sessionStatus !== undefined) {
      return {
        subscribe: (fn) => sessionStatus.subscribe(fn),
        has: (sessionId) => sessionStatus.getSnapshot().get(sessionId)?.pendingInteraction !== undefined,
      }
    }
    const legacy = ctx.uiSession.pendingInteractions
    if (legacy !== undefined) {
      return {
        subscribe: (fn) => legacy.subscribe(fn),
        has: (sessionId) => legacy.getSnapshot().has(sessionId),
      }
    }
    return null
  }

  const pending = pendingSource()

  /** Capture the current session's derived state; returns null when not on a session page. */
  function currentDerived(list) {
    if (!document.title.includes(' — ')) return null
    const sessionId = mainSessionId()
    if (sessionId === undefined) return null
    const state = list.getSnapshot()
    const session = state.byId[sessionId]
    if (!session) return null
    const runningSubs = countRunningSubagents(sessionId, state.byId)
    return deriveState(session, runningSubs, pending !== null && pending.has(sessionId))
  }

  /**
   * Single decision point for notification state.
   * Applies the baseline guard and warning stickiness once, so both the
   * favicon and sound features always agree on *what* to notify.
   * Returns null when there is nothing to report (not on a session page,
   * no session, or the baseline was terminal).
   */
  function notificationState(list) {
    const s = currentDerived(list)
    if (s === null) return null
    // If the baseline was terminal (done), the session was already idle or
    // completed when the user switched away — nothing new to report.
    if (baseline === 'done') return null
    // Exception: pending interaction always overrides the baseline guard.
    // If the user was asked a question before switching away, keep the
    // amber indicator even after they return to a terminal state.
    if (baseline === 'warning') return s === 'ongoing' ? 'ongoing' : 'warning'
    return s
  }

  // Compute the indicator favicon href for the current notification state.
  // DSH's DocumentTitle sets session pages as "${title} — ${productTitle}",
  // while the welcome page is just the product title (no " — " separator).
  function indicatorForCurrent(list) {
    const s = notificationState(list)
    if (s === null) return null
    return indicatorSvg(s, readStyle())
  }

  /**
   * Check for state transitions and play the appropriate sound.
   * Respects the sound scope setting: 'hidden' only fires while the page is
   * away (tab hidden or window blurred), 'always' fires regardless.
   */
  function handleSound(list) {
    const scope = readSoundScope()
    if (scope === 'hidden' && !isAway()) return
    const sessionId = mainSessionId()
    const current = notificationState(list)
    if (current === null) return

    // Switched to a different session — seed the tracker silently.
    if (sessionId !== previousSessionId) {
      previousSessionId = sessionId
      previousNotification = current
      return
    }

    if (current === previousNotification) return

    // No previous state means we just initialised or just switched back —
    // seed the tracker silently without playing a sound.
    if (previousNotification === undefined) {
      previousNotification = current
      return
    }

    previousNotification = current

    if (current === 'warning') {
      const soundId = readSoundWarning()
      if (soundId !== 'none') playSound(soundId)
    } else if (current === 'done') {
      const soundId = readSoundDone()
      if (soundId !== 'none') playSound(soundId)
    }
  }

  /** Point every icon link at `href`; `null` restores each link's original. */
  function setIcon(href) {
    for (const icon of icons) {
      const next = href ?? icon.href
      if (icon.link.href !== next) icon.link.href = next
    }
  }

  // Apply the correct favicon based on current visibility + session state.
  function refresh(list) {
    setIcon(document.hidden ? indicatorForCurrent(list) : null)
    handleSound(list)
  }

  ctx.effect(() => {
    const list = ctx.sessions.list

    refresh(list)
    const unsubSessions = list.subscribe(() => refresh(list))
    // Main-view switches change the indicator's subject; the pending source
    // changes its state (either source is absent on the other generation).
    const unsubPending = pending === null ? () => {} : pending.subscribe(() => refresh(list))
    const unsubMain = ctx.uiSession.adapter?.current?.subscribe?.(() => refresh(list)) ?? (() => {})

    /**
     * Seed the transition tracker at the instant the page goes away, so the
     * first sound only fires on a genuine state change *after* that moment
     * (a change that already happened while the user was watching is not
     * replayed the moment they switch away).
     */
    function seedTracker() {
      previousNotification = notificationState(list)
    }

    function onVisibilityChange() {
      if (document.hidden) {
        // Capture the baseline at the instant the tab is hidden.
        baseline = currentDerived(list)
        seedTracker()
      } else {
        // Clear the baseline and sound tracker when the tab becomes visible.
        baseline = undefined
        previousNotification = undefined
        previousSessionId = undefined
      }
      refresh(list)
    }

    /**
     * Window blur — the user switched to another application/window while this
     * tab stayed visible. From here on the page counts as "away" for the
     * 'hidden' sound scope; focus coming back does not clear the tracker
     * (only a re-blur re-seeds it, so 'always' mode keeps its live tracking).
     */
    function onBlur() {
      windowFocused = false
      seedTracker()
      refresh(list)
    }

    function onFocus() {
      windowFocused = true
      refresh(list)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    return () => {
      unsubSessions()
      unsubPending()
      unsubMain()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      setIcon(null)
    }
  })
}