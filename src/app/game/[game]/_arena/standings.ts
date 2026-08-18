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
 *   within a group, more money is a higher place.
 *
 * Mirroring matters because the server sets `winner` from the top of ITS sort.
 * A different rule here could put someone else first on the scoreboard while
 * the server crowned another player, and the screen would be arguing with the
 * result it is reporting.
 *
 * NOT MODELLED: the order players were eliminated in. Nothing records it —
 * state.eliminated is rebuilt empty every round, and no eliminatedAt exists on
 * a player — so two broke players are separated by money alone, and by nothing
 * at all when both sit at zero. That needs a backend change to fix properly.
 */
export function rankPlayers(
  players: GamePlayer[] | undefined | null
): GamePlayer[] {
  return [...(players ?? [])]
    .filter((p) => !p.isSpectator)
    .sort((a, b) =>
      a.alive !== b.alive ? (a.alive ? -1 : 1) : (b.money ?? 0) - (a.money ?? 0)
    );
}

/** signed and pre-formatted, e.g. "+$740" — the delta against the buy-in */
export function moneyChange(money: number, startingMoney: number): string {
  const delta = (money ?? 0) - (startingMoney ?? 0);
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}$${Math.abs(delta).toLocaleString('en-US')}`;
}
