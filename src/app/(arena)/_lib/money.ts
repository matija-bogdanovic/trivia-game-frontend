/**
 * Money as the arena shows it: `$1,250`.
 *
 * The Angular app expresses this as a pipe; the point is the same either way —
 * one place decides the grouping. Locale is pinned to en-US so separators do
 * not drift with the host machine: table stakes are a game currency, not the
 * player's own.
 */
export function money(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}
