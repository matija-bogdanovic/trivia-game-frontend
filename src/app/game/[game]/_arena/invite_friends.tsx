'use client';

import { useEffect, useState } from 'react';
import Modal from '@/app/(arena)/_components/modal';
import Avatar from '@/app/(arena)/_components/avatar';
import {
  CheckIcon,
  EyeIcon,
  UserPlusIcon,
  UsersThreeIcon,
} from '@/app/(arena)/_components/icons';
import {
  fetchFriends,
  presenceOf,
  type FriendSummary,
  type PresenceStatus,
} from '@/app/helpers/friends';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';

/**
 * Pick a friend to ask into this room.
 *
 * ── WHAT IS INVITABLE ──────────────────────────────────────────────────────
 * Anyone ONLINE, which now includes friends who are merely browsing the app —
 * PresenceProvider holds a socket on every arena screen, so "online" finally
 * describes more than the handful of people sitting in some other room.
 *
 * Offline friends are shown, greyed, unclickable. Hiding them would leave a
 * player wondering whether the list is broken or their friend is asleep, and
 * "not online" is the more useful of the two answers.
 *
 * Friends already at this table are labelled rather than removed, for the same
 * reason: their absence would read as an omission.
 *
 * ── THE ANSWER COMES BACK OVER THE SOCKET ──────────────────────────────────
 * `invite_friend` is fire-and-forget from here; the server replies with
 * invite_sent or invite_failed on the same socket, and the lobby turns that
 * into the tick or the message beside the row. So a refusal names a person —
 * "X trenutno nije onlajn" — instead of a generic failure.
 *
 * ── AND, FOR THE HOST, ANYONE AT ALL ───────────────────────────────────────
 * The host gets a name field above the list. A room being filled is exactly
 * the case the friends list cannot serve: the person you are waiting for is
 * often somebody you have not added yet.
 *
 * The username IS the identifier — no #1234 beside it — because usernames are
 * already unique, which is the decision that made this one field instead of
 * two. The server still refuses the same way for everyone (full, seated
 * already, yourself), and adds one answer only this path can produce: no such
 * player, for a name that was simply typed wrong.
 */
const DOT: Record<PresenceStatus, string> = {
  playing: 'bg-live',
  spectating: 'bg-frost',
  online: 'bg-ready',
  offline: 'bg-arena-500',
};

export default function InviteFriends({
  open,
  onClose,
  /** usernames already at this table — seated or watching */
  inRoom,
  /** targets the server has confirmed */
  sent,
  /** the last refusal, already worded */
  notice,
  /** the host may name anyone; everyone else is limited to their friends */
  canInviteAnyone,
}: {
  open: boolean;
  onClose: () => void;
  inRoom: string[];
  sent: string[];
  notice: string | null;
  canInviteAnyone: boolean;
}) {
  const { t } = useT();
  const { inviteFriend } = useGame();
  const [friends, setFriends] = useState<FriendSummary[] | null>(null);
  const [typed, setTyped] = useState('');

  /*
   * Emptied once the server confirms THIS name, not on click. A refusal has to
   * leave the text where it is — a misspelling is corrected by editing it, and
   * clearing the field would make the person retype the whole thing to change
   * one letter.
   */
  useEffect(() => {
    if (typed.trim() && sent.includes(typed.trim())) setTyped('');
  }, [sent, typed]);

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const submitTyped = () => {
    const name = typed.trim();
    if (name) inviteFriend(name);
  };

  /*
   * Fetched when the dialog OPENS, not when the lobby mounts — presence goes
   * stale, and a list read twenty minutes ago would offer to invite people who
   * have since gone. Re-read on each open for the same reason.
   */
  useEffect(() => {
    if (!open) return;
    let live = true;
    setFriends(null);
    fetchFriends().then((snap) => {
      if (live) setFriends(snap?.friends ?? []);
    });
    return () => {
      live = false;
    };
  }, [open]);

  return (
    <Modal
      open={open}
      wide
      closeButton
      title={t('arena.invite.title')}
      onClose={onClose}
    >
      {notice && (
        <p
          className="text-[11px] leading-relaxed tracking-wider text-gold"
          role="status"
          aria-live="polite"
        >
          {notice}
        </p>
      )}

      {/* ============================================ the host's name field */}
      {canInviteAnyone && (
        <div className="mb-4 rounded-lg border border-white/[0.07] bg-arena-750 p-4">
          <label
            className="mb-1 block text-[10px] tracking-[0.25em] text-arena-200 uppercase"
            htmlFor="invite-username"
          >
            {t('arena.invite.byName')}
          </label>
          <p className="mb-3 text-[11px] text-arena-300">
            {t('arena.invite.byNameHint')}
          </p>
          <div className="flex gap-2">
            <input
              id="invite-username"
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitTyped();
                }
              }}
              placeholder={t('arena.invite.byNamePlaceholder')}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-white/10 bg-arena-800 px-3 py-2 text-sm text-white outline-none focus:border-gold/40"
            />
            <button
              type="button"
              onClick={submitTyped}
              disabled={!typed.trim()}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-4 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                typed.trim()
                  ? 'cursor-pointer border-gold/40 text-gold hover:bg-gold/10'
                  : 'cursor-not-allowed border-arena-500 text-arena-500'
              }`}
            >
              <UserPlusIcon className="h-3.5 w-3.5 shrink-0" />
              {t('arena.invite.add')}
            </button>
          </div>
        </div>
      )}

      {friends !== null && friends.length === 0 && (
        <div className="py-6 text-center">
          <div className="mb-3 flex justify-center" aria-hidden="true">
            <UsersThreeIcon className="h-8 w-8 text-arena-500" />
          </div>
          <p className="text-[11px] text-arena-300">{t('arena.invite.none')}</p>
        </div>
      )}

      <div className="max-h-72 space-y-2 overflow-y-auto">
        {(friends ?? []).map((friend) => {
          const presence = presenceOf(friend);
          const here = inRoom.includes(friend.username);
          const already = sent.includes(friend.username);
          const name = friend.displayName || friend.username;
          const invitable = presence !== 'offline' && !here && !already;
          return (
            <div
              key={friend.username}
              className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-arena-750 p-3"
            >
              <span className="relative shrink-0">
                <Avatar username={friend.username} name={name} size="sm" />
                <span
                  className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-arena-750 ${DOT[presence]}`}
                  aria-hidden="true"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-white">
                  {name}
                </span>
                <span className="flex items-center gap-1 text-[10px] tracking-wider text-arena-300 uppercase">
                  {presence === 'spectating' && (
                    <EyeIcon className="h-3 w-3 shrink-0" />
                  )}
                  {here
                    ? t('arena.invite.inRoom')
                    : t(
                        `arena.friends.status${
                          presence.charAt(0).toUpperCase() + presence.slice(1)
                        }`
                      )}
                </span>
              </span>
              {already ? (
                <span className="flex shrink-0 items-center gap-1 text-[10px] tracking-wider text-ready uppercase">
                  <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                  {t('arena.invite.sent')}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!invitable}
                  onClick={() => inviteFriend(friend.username)}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                    invitable
                      ? 'cursor-pointer border-gold/40 text-gold hover:bg-gold/10'
                      : 'cursor-not-allowed border-arena-500 text-arena-500'
                  }`}
                >
                  {t('arena.invite.send')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
