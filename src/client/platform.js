/**
 * Runtime platform probe for the browser half.
 *
 * The Desktop (Electron) shell and a browser-served (`dsh web`) page execute
 * the very same client bundle, so "desktop-only" or "web-only" UI has to be
 * decided at runtime — the boot graph carries no platform field.
 *
 * The Desktop preload marks every document it attaches to in three
 * independent ways:
 *
 *   - `<html data-platform="darwin|win32|linux">` — `markDocumentPlatform()`
 *     in the shell preload, the same hook the shell's own desktop-scoped CSS
 *     relies on;
 *   - `window.dshDesktop` — the preload bridge (`{ protocolVersion: 1 }` at
 *     minimum, the full product API in the main frame);
 *   - an `Electron/<version>` token in the Chromium user agent.
 *
 * A plain browser has none of them.  All three are checked because a desktop
 * sub-frame may not receive the preload, and every read is guarded so the
 * probe also stays false in a non-browser (Node) process.
 */

/**
 * True when the UI is hosted by the Desktop (Electron) shell rather than by a
 * browser page.
 *
 * @returns {boolean}
 */
export function isDesktopUI() {
  if (typeof document === 'undefined') return false
  if (document.documentElement?.dataset?.platform) return true
  if (typeof globalThis !== 'undefined' && 'dshDesktop' in globalThis) return true
  return typeof navigator !== 'undefined' && /Electron\//.test(navigator.userAgent ?? '')
}
