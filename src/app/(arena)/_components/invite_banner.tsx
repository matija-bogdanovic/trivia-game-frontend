'use client';

import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlusIcon, XIcon } from './icons';
import {
  inviteCleared,
  inviteDeclined,
} from '@/app/redux/slicers/invite_slice';
import type { AppDispatch, RootState } from '@/app/redux/store';
import { useT } from '@/app/lib/i18n';

/**
 * "{name} te poziva u sobu" — the in-session tier of notifications.
 *
 * Rendered by BOTH shells, because an invite can land while you are browsing
 * and while you are already sitting in a different lobby, and the answer is
 * the same in both cases.
 *
 * ── WHY IT IS NOT A TOAST ──────────────────────────────────────────────────
 * Toasts expire. This one asks a question with two answers and no default —
 * accepting navigates you into somebody's room, and declining is a decision
 * the sender's UI cannot see either way. A prompt that disappears while
 * unanswered would silently pick "no" on the reader's behalf, so it stays
 * until it is answered.
 *
 * It sits bottom-centre like the reconnect banner, above it in z-order, and
 * uses role="alert" — an invite arriving unprompted is exactly what that role
 * is for.
 */
export default function InviteBanner() {
  const { t } = useT();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const invite = useSelector((s: RootState) => s.invite.pending);

  if (!invite) return null;

  const accept = () => {
    /*
     * Cleared, not declined — the reader said yes, so the room must NOT go on
     * the "never show me this again" list. Cleared first so the banner is gone
     * before the route change rather than flashing over the room it opened.
     */
    dispatch(inviteCleared());
    router.push(`/game/${invite.lobbyId}`);
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 z-40 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-sm border border-gold/40 bg-arena-800 px-4 py-3 shadow-lg sm:bottom-6"
      role="alert"
    >
      <UserPlusIcon className="h-5 w-5 shrink-0 text-gold" />
      <div className="min-w-0">
        <div className="truncate text-[12px] text-arena-100">
          {t('arena.invite.banner', { name: invite.fromName })}
        </div>
        {invite.roomName && (
          <div className="truncate text-[10px] tracking-wider text-arena-300 uppercase">
            {invite.roomName}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={accept}
        className="shrink-0 cursor-pointer bg-gold px-4 py-2 text-[10px] font-bold tracking-[0.15em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        {t('arena.invite.join')}
      </button>
      <button
        type="button"
        onClick={() => dispatch(inviteDeclined())}
        aria-label={t('arena.invite.decline')}
        title={t('arena.invite.decline')}
        className="shrink-0 cursor-pointer p-1 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
