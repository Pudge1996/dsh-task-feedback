/**
 * dsh-status-indication — client half.
 *
 * When the browser tab is hidden, replaces the favicon with a double-circle
 * dot matching the current session's status so you can glance at the tab bar
 * and know what's happening:
 *   green  — idle / completed
 *   blue   — running (agent or subagent)
 *   amber  — waiting for approval, plan review, or question answer
 *
 * When the tab is visible again the original favicon is restored immediately.
 *
 * Zero dependencies beyond the built-in `ctx.sessions` service.  No React, no
 * slots, no CSS — a single ctx.effect() with DOM access.
 */

// StateDot states as defined in @deepseek-ai/dsh-client-ui-primitives StateDot.tsx
// done | warning | ongoing | error

/** Pure inline SVG data URI for one state dot.
 *  All states share the same double-circle layout:
 *    outer circle (32px / r=16) — same 500 colour at 0.1 opacity
 *    inner circle (22px / r=11) — 500-level fill, leaving a 5 px translucent ring
 */
function dotSvg(state) {
  const rgb = {
    done:    '34, 197, 94',   // green-500
    warning: '245, 158, 11',  // amber-500
    ongoing: '65, 118, 230',  // deepseek-500
    error:   '239, 68, 68',   // red-500
  }
  const c = rgb[state] ?? rgb.done

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="16" fill="rgba(${c},0.2)" />
  <circle cx="16" cy="16" r="11" fill="rgb(${c})" />
</svg>`

  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// Four precomputed URIs
const DONE    = dotSvg('done')
const WARNING = dotSvg('warning')
const ERROR   = dotSvg('error')
const ONGOING = dotSvg('ongoing')

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
function deriveState(session, runningSubagentCount) {
  if (session.pendingInteraction) return 'warning'
  if (session.running)             return 'ongoing'
  if (runningSubagentCount > 0)    return 'ongoing'
  // completed is true when the session finished running while not selected
  return 'done'
}

export const inject = ['sessions']

export function apply(ctx) {
  const link = document.querySelector('link[rel="icon"]')
  if (!link) return // no favicon element to update

  const originalHref = link.href

  // Compute the dot favicon href for the current session state, or null
  // when there is no active session (→ fall back to original).
  function dotForCurrent(list) {
    const state = list.getSnapshot()
    const session = state.current ? state.byId[state.current] : undefined
    if (!session) return null
    const runningSubs = countRunningSubagents(state.current, state.byId)
    const s = deriveState(session, runningSubs)
    return s === 'warning' ? WARNING : s === 'ongoing' ? ONGOING : DONE
  }

  // Apply the correct favicon based on current visibility + session state.
  function refresh(list) {
    if (document.hidden) {
      const href = dotForCurrent(list) ?? originalHref
      if (link.href !== href) link.href = href
    } else {
      if (link.href !== originalHref) link.href = originalHref
    }
  }

  ctx.effect(() => {
    const list = ctx.sessions.list

    refresh(list)
    const unsubSessions = list.subscribe(() => refresh(list))

    function onVisibilityChange() { refresh(list) }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      unsubSessions()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (link.href !== originalHref) link.href = originalHref
    }
  })
}