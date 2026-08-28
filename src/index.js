/**
 * dsh-status-indication — host half.
 *
 * The browser half owns the entire feature (favicon swap via ctx.effect).
 * There are no commands, services, or session hooks to register here, but the
 * bundle manifest expects `lib/index.js` to exist, so this file is a minimal
 * apply() stub.
 */
export function apply() {
  // no-op: the client half is self-contained.
}