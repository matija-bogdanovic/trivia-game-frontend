'use client';

import Modal from './modal';
import Avatar from './avatar';
import { EyeIcon, FlameIcon, SnowflakeIcon } from './icons';
import { useT } from '@/app/lib/i18n';
import type { PresenceStatus } from '@/app/helpers/friends';

/**
 * A player's profile, as an overlay.
 *
 * ── WHY A MODAL AND NOT A ROUTE ────────────────────────────────────────────
 * Every list in the app — friends, the leaderboard, the home rail — is a place
 * you scan several people in a row. Opening a page to read one player's wins
 * costs the whole list: the scroll position, the filter, the tab you were on,
 * and a trip back. An overlay leaves all of it standing behind the card, so
 * looking at four players in a row is four glances rather than eight
 * navigations.
 *
 * /profile stays as it is. That is YOUR profile, with the controls that go
 * with it, and this is a read-only look at somebody else's.
 *
 * ── WHAT IT CAN SHOW, AND WHY THAT IS THE LIMIT ────────────────────────────
 * There is NO per-player endpoint on the backend. GET /leaderboard is the top
 * twenty, POST /friends/list is your own friends, POST /wallet is only ever
 * you. So this card cannot fetch anybody: it renders what the list that opened
 * it already holds, and each stat is optional because the two sources carry
 * different columns — the leaderboard knows gamesPlayed and bestStreak, the
 * friends list knows presence.
 *
 * A stat that is absent is not rendered as a zero. "0 partija" and "we were
 * never told" are different facts, and printing the first for the second is
 * the kind of quiet lie this app has been cleaning out.
 *
 * The avatar needs nothing but the username — Avatar builds the picture URL
 * itself — so a player's real picture appears here even though the row that
 * opened the card never fetched one.
 */
export interface PlayerCard {
  username: string;
  displayName?: string | null;
  /** absent when the opener has no presence information (the leaderboard) */
  presence?: PresenceStatus;
  points?: number;
  wins?: number;
  gamesPlayed?: number;
  currentStreak?: number;
  currentLosingStreak?: number;
  bestStreak?: number;
}

/** The same vocabulary the friends list uses, so a dot means one thing app-wide. */
const PRESENCE: Record<
  PresenceStatus,
  { dot: string; text: string; key: string }
> = {
  playing: {
    dot: 'bg-live',
    text: 'text-live',
    key: 'arena.friends.statusPlaying',
  },
  spectating: {
    dot: 'bg-frost',
    text: 'text-frost',
    key: 'arena.friends.statusSpectating',
  },
  online: {
    dot: 'bg-ready',
    text: 'text-ready',
    key: 'arena.friends.statusOnline',
  },
  offline: {
    dot: 'bg-arena-500',
    text: 'text-arena-400',
    key: 'arena.friends.statusOffline',
  },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/[0.07] bg-arena-750 p-3 text-center">
      <div className="mb-1 text-[9px] tracking-[0.2em] text-arena-300 uppercase">
        {label}
      </div>
      <div className="text-sm font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

export default function PlayerPreview({
  player,
  onClose,
}: {
  /** null closes the overlay — one piece of state drives both */
  player: PlayerCard | null;
  onClose: () => void;
}) {
  const { t } = useT();
  if (!player) return null;

  const name = player.displayName || player.username;
  const look = player.presence ? PRESENCE[player.presence] : null;

  /*
   * The streak line follows the profile screen's rule: exactly one run is ever
   * live, so whichever is positive is the one shown and neither appears when
   * both are absent or zero.
   */
  const win = player.currentStreak ?? 0;
  const cold = player.currentLosingStreak ?? 0;

  const rate =
    player.gamesPlayed && player.wins !== undefined && player.gamesPlayed > 0
      ? `${Math.round((player.wins / player.gamesPlayed) * 100)}%`
      : null;

  const stats: { label: string; value: string }[] = [];
  if (player.points !== undefined)
    stats.push({
      label: t('arena.lb.points'),
      value: player.points.toLocaleString('en-US'),
    });
  if (player.wins !== undefined)
    stats.push({ label: t('arena.lb.wins'), value: String(player.wins) });
  if (player.gamesPlayed !== undefined)
    stats.push({
      label: t('arena.stat.gamesPlayed'),
      value: String(player.gamesPlayed),
    });
  if (rate) stats.push({ label: t('arena.stat.winRate'), value: rate });
  if (player.bestStreak !== undefined)
    stats.push({
      label: t('arena.stat.bestStreak'),
      value: String(player.bestStreak),
    });

  return (
    <Modal
      open
      wide
      closeButton
      title={t('arena.player.title')}
      onClose={onClose}
    >
      <div className="flex items-center gap-4">
        <span className="relative shrink-0">
          <Avatar username={player.username} name={name} alt={name} size="xl" />
          {look && (
            <span
              className={`absolute right-0.5 bottom-0.5 h-4 w-4 rounded-full border-2 border-arena-800 ${look.dot}`}
              aria-hidden="true"
            />
          )}
        </span>
        <div className="min-w-0">
          <div className="truncate text-lg font-bold text-white">{name}</div>
          {look && (
            <div
              className={`mt-0.5 flex items-center gap-1 text-[10px] tracking-wider uppercase ${look.text}`}
            >
              {player.presence === 'spectating' && (
                <EyeIcon className="h-3 w-3 shrink-0" />
              )}
              {t(look.key)}
            </div>
          )}
          {win > 0 ? (
            <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-flame">
              <FlameIcon className="h-4 w-4 shrink-0" />
              {t('arena.profile.streakWins', { n: win })}
            </div>
          ) : cold > 0 ? (
            <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-frost">
              <SnowflakeIcon className="h-4 w-4 shrink-0" />
              {t('arena.profile.streakLosses', { n: cold })}
            </div>
          ) : null}
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-arena-300">
          {t('arena.player.noStats')}
        </p>
      )}
    </Modal>
  );
}
