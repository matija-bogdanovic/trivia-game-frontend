import type { GamePlayer } from '@/app/redux/slicers/game_slice';

/**
 * The finishing order, derived exactly as the server derives it.
 *
 * game_over carries only winner, rounds and potAwarded — no standings — so the
 * order has to be computed from the final game_state. This mirrors
 * enterGameOver's own sort rather than inventing a rule:
 *
 *   spectators are not placed at all;
 *   anyone still alive outranks anyone eliminated;
 *   among the eliminated, whoever went out LATER placed higher — surviving
 *     longer is the achievement, and money at the moment of going out is not;
 *   money settles what is left.
 *
 * Mirroring matters because the server sets `winner` from the top of ITS sort.
 * A different rule here could put someone else first on the scoreboard while
 * the server crowned another player, and the screen would be arguing with the
 * result it is reporting.
 *
 * BACKWARD-SAFE. eliminatedAt is new, and a roster from before it — or one
 * where only some players carry it — must not reorder into nonsense. Two
 * eliminated players are compared on it only when BOTH have one; otherwise the
 * comparison falls through to money, which is exactly the old behaviour. A
 * payload with no timestamps anywhere therefore sorts identically to before.
 */
export function rankPlayers(
  players: GamePlayer[] | undefined | null
): GamePlayer[] {
  return [...(players ?? [])]
    .filter((p) => !p.isSpectator)
    .sort((a, b) => {
      // the living, before the dead
      if (a.alive !== b.alive) return a.alive ? -1 : 1;

      // among the dead, whoever lasted longer placed higher — but only when
      // both are stamped, so a mixed or older roster is left to money
      if (!a.alive && !b.alive) {
        const at = timeOf(a);
        const bt = timeOf(b);
        if (at !== null && bt !== null && at !== bt) return bt - at;
      }

      return (b.money ?? 0) - (a.money ?? 0);
    });
}

/** a usable elimination stamp, or null when there is not one */
function timeOf(p: GamePlayer): number | null {
  const raw = p.eliminatedAt;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  // tolerate an ISO string, which is how the REST side states its timestamps
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** signed and pre-formatted, e.g. "+$740" — the delta against the buy-in */
export function moneyChange(money: number, startingMoney: number): string {
  const delta = (money ?? 0) - (startingMoney ?? 0);
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}$${Math.abs(delta).toLocaleString('en-US')}`;
}
