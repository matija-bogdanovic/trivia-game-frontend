'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlusIcon, XIcon } from '@/app/(arena)/_components/icons';
import { dismissHostChange } from '@/app/redux/slicers/game_slice';
import type { AppDispatch, RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';

/**
 * "The room changed hands" — shown in the lobby and during a match.
 *
 * ── ONE COMPONENT, TWO MOUNTS ──────────────────────────────────────────────
 * It lives in both because the handover can happen in both: a host who closes
 * their tab mid-round hands the room on exactly as one who leaves the lobby
 * does. Writing it twice would be two banners that drift, and this one already
 * carries three decisions worth keeping in one place — the wording split, the
 * timer, and who dismisses it.
 *
 * Mounting it twice is safe because the state is single: whichever screen is
 * on the page reads the same `hostChanged`, and dismissing from either clears
 * it for both. The two are never rendered at once — the lobby and the match
 * are different phases.
 *
 * ── TWO SENTENCES ─────────────────────────────────────────────────────────
 * "You are the host now" for the person who inherited it, "{name} is the host
 * now" for everybody else. One is an instruction and the other is news, and
 * giving the new host the second version would bury the only part that asks
 * anything of them.
 *
 * ── WHY IT IS NOT AN ALERT ────────────────────────────────────────────────
 * role="status". Nobody is in danger and nothing is owed in reply, so it is
 * announced without interrupting — which matters more mid-match than it does
 * in a lobby, where there is nothing to interrupt.
 */
export default function HostChangeBanner({
  /** compact drops the explanatory second line, for the match screen */
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  const { t } = useT();
  const dispatch = useDispatch<AppDispatch>();
  const hostChanged = useSelector((s: RootState) => s.game.hostChanged);
  /*
   * From the game context, not the slice — the slice's `username` fields all
   * belong to nested player records, and the signed-in user's own name lives
   * on the provider that holds the socket. Both mount points are inside it.
   */
  const { username: me } = useGame();

  /*
   * Ten seconds, or a dismiss. Long enough to be read by somebody looking
   * elsewhere, short enough not to sit over the screen for the rest of the
   * wait — and mid-match, short enough not to cover a question.
   *
   * Keyed on the notice, so a SECOND handover restarts the timer rather than
   * inheriting the remains of the first one's.
   */
  useEffect(() => {
    if (!hostChanged) return;
    const timer = setTimeout(() => dispatch(dismissHostChange()), 10000);
    return () => clearTimeout(timer);
  }, [hostChanged, dispatch]);

  if (!hostChanged) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 ${className}`}
      role="status"
    >
      <UserPlusIcon className="h-4 w-4 shrink-0 text-gold" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-bold text-gold">
          {hostChanged.host === me
            ? t('arena.lobby.hostChangedYou')
            : t('arena.lobby.hostChanged', { name: hostChanged.hostName })}
        </div>
        {!compact && (
          <div className="text-[10px] tracking-wider text-arena-200">
            {t('arena.lobby.hostLeftWhy')}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dispatch(dismissHostChange())}
        aria-label={t('arena.common.close')}
        title={t('arena.common.close')}
        className="shrink-0 cursor-pointer p-1 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
