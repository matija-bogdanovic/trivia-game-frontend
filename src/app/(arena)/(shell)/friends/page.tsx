'use client';

import { useEffect, useState } from 'react';
import Avatar from '@/app/(arena)/_components/avatar';
import PageHeader from '@/app/(arena)/_components/page_header';
import { useT } from '@/app/lib/i18n';
import { getIdentity } from '@/app/helpers/token_operations';
import {
  fetchFriends,
  friendAction,
  type FriendActionError,
  type FriendRequestEntry,
  type FriendSummary,
} from '@/app/helpers/friends';
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonRegion,
} from '@/app/(arena)/_components/skeleton';

/**
 * Whole days until a denied person may be asked again, or null when the wait
 * is already over (or the server did not say). Rounded up: half a day left is
 * still "1", because "0" would read as "now" and the send would be refused.
 */
function retryDays(entry: FriendRequestEntry): number | null {
  if (!entry.retryAt) return null;
  const remaining = entry.retryAt - Date.now();
  if (remaining <= 0) return null;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

/** how a refused action is worded on this screen, in the player's language */
const ERROR_KEY: Record<FriendActionError, string> = {
  self: 'arena.friends.errSelf',
  'not-found': 'arena.friends.errNoUser',
  'already-friends': 'arena.friends.errAlready',
  'already-sent': 'arena.friends.errPending',
  'no-such-request': 'arena.friends.errFailed',
  'denied-cooldown': 'arena.friends.errDeniedCooldown',
  'too-many-pending': 'arena.friends.errTooManyPending',
  'rate-limited': 'arena.friends.errRateLimited',
  unauthenticated: 'arena.friends.errFailed',
  failed: 'arena.friends.errFailed',
  unreachable: 'arena.friends.errUnreachable',
};

/**
 * Friend list, search, and both sides of the request flow.
 *
 * The export rendered the accept/decline buttons and the "send request" form
 * without wiring any of them, so every control was inert. They act on the list
 * here, as in the Angular app.
 *
 * Every call goes through helpers/friends.ts, which is where the endpoint
 * shapes, the status vocabulary and the server's English refusals are read —
 * this screen deals in states and reasons, not in response bodies.
 */
export default function Page() {
  const { t } = useT();
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [requests, setRequests] = useState<FriendRequestEntry[]>([]);
  /** requests I sent — populated only where the server reports them */
  const [outgoing, setOutgoing] = useState<FriendRequestEntry[]>([]);
  /**
   * Whether the server answers with outgoing requests at all.
   *
   * It does once the updated Lambda is deployed; an older one returns no
   * `outgoing` key and this stays false. The sent panel is gated on it rather
   * than on the array being non-empty, because against an old function an
   * empty panel would read as "you have sent none" — a claim that deployment
   * cannot make.
   */
  const [outgoingSupported, setOutgoingSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await getIdentity();
      if (!id) {
        if (!cancelled) {
          setSignedIn(false);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setSignedIn(true);
      const snapshot = await fetchFriends();
      if (!cancelled) {
        if (snapshot) {
          setFriends(snapshot.friends);
          setRequests(snapshot.incoming);
          setOutgoing(snapshot.outgoing);
          setOutgoingSupported(snapshot.outgoingSupported);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const [search, setSearch] = useState('');
  const [addName, setAddName] = useState('');
  const [sending, setSending] = useState(false);
  /** the outcome of the last send, shown under the field */
  const [addNotice, setAddNotice] = useState<{
    kind: 'sent' | 'accepted' | 'error';
    text: string;
  } | null>(null);

  /** reload after anything that changes the friendship graph */
  const reload = async () => {
    const snapshot = await fetchFriends();
    if (!snapshot) return; // the list just stays as it was
    setFriends(snapshot.friends);
    setRequests(snapshot.incoming);
    setOutgoing(snapshot.outgoing);
    setOutgoingSupported(snapshot.outgoingSupported);
  };

  const term = search.trim().toLowerCase();
  const matching = term
    ? friends.filter((f) =>
        (f.displayName || f.username).toLowerCase().includes(term)
      )
    : friends;
  const online = matching.filter((f) => f.online);
  const offline = matching.filter((f) => !f.online);
  const canSendRequest = addName.trim().length > 0;

  /**
   * Send a friend request by exact username.
   *
   * There is no user-search endpoint, so the name has to be exact — the
   * backend answers an unknown one with "User not found" rather than
   * suggesting anybody. Its refusals come back as English strings on a 400,
   * and they are matched here rather than shown raw, because they are
   * server-internal wording and this screen is Serbian by default.
   *
   * "request" can also come back as "accepted": if the person had already
   * asked you, the backend treats your request as taking them up on it. That
   * is a different outcome and says so.
   */
  const sendRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = addName.trim();
    if (!name || sending) return;

    setSending(true);
    setAddNotice(null);

    const result = await friendAction(name, 'request');
    if (result.ok) {
      const accepted = result.status === 'accepted';
      setAddNotice({
        kind: accepted ? 'accepted' : 'sent',
        text: accepted
          ? t('arena.friends.nowFriends', { name })
          : t('arena.friends.requestSent', { name }),
      });
      setAddName('');
      await reload();
    } else {
      setAddNotice({
        kind: 'error',
        text: t(ERROR_KEY[result.reason], { name }),
      });
    }
    setSending(false);
  };

  /**
   * Answer an incoming request.
   *
   * The row leaves the list first and the call follows, because the answer is
   * the same either way — an accepted request stops being a request, and so
   * does a denied one. Accepting also produces a friend, so that case waits
   * for the list to come back rather than guessing a row.
   */
  const act = async (
    request: FriendRequestEntry,
    action: 'accept' | 'decline'
  ) => {
    const target = request.username;
    if (!target) return;
    setRequests((current) => current.filter((r) => r.username !== target));
    const result = await friendAction(target, action);
    // put it back if the server refused: a row that vanished on a failed
    // call is a request the player can no longer answer
    if (!result.ok) {
      await reload();
      return;
    }
    if (action === 'accept') await reload();
  };

  /**
   * Withdraw a request I sent. Needs the `cancel` action on the endpoint, and
   * is only reachable from the panel that needs `outgoing` — the same backend
   * piece delivers both, so this cannot be pressed before it exists.
   */
  const cancelOutgoing = async (entry: FriendRequestEntry) => {
    setOutgoing((current) =>
      current.filter((r) => r.username !== entry.username)
    );
    const result = await friendAction(entry.username, 'cancel');
    if (!result.ok) await reload();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow={t('arena.friends.eyebrow')}
        title={t('arena.friends.title')}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ===================================================== friend list */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <label className="sr-only" htmlFor="friend-search">
              {t('arena.friends.searchLabel')}
            </label>
            <input
              id="friend-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('arena.friends.searchPlaceholder')}
              className="w-full border border-white/10 bg-arena-800 px-4 py-3 text-sm text-white outline-none placeholder:text-arena-400 focus:border-gold/40"
            />
          </div>

          {/* friend rows, avatar and name and the action on the right */}
          {loading && (
            <SkeletonRegion className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border border-white/[0.07] bg-arena-800 p-3"
                >
                  <SkeletonAvatar size="sm" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </SkeletonRegion>
          )}

          {!loading && !signedIn && (
            <div className="py-8 text-center text-[11px] text-arena-300">
              {t('arena.common.signInPrompt')}
            </div>
          )}

          {!loading && signedIn && friends.length === 0 && (
            <div className="py-8 text-center text-[11px] text-arena-300">
              {t('arena.friends.empty')}
            </div>
          )}

          {!loading && friends.length > 0 && matching.length === 0 && (
            <div className="py-16 text-center text-arena-300">
              <div className="mb-4 text-4xl" aria-hidden="true">
                ◎
              </div>
              <div className="text-sm tracking-wider uppercase">
                {t('arena.friends.noMatches')}
              </div>
            </div>
          )}

          {online.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] tracking-[0.25em] text-arena-300 uppercase">
                {t('arena.friends.online', { n: online.length })}
              </h2>
              <div className="space-y-2">
                {online.map((friend) => (
                  <FriendRow key={friend.username} friend={friend} />
                ))}
              </div>
            </section>
          )}

          {offline.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] tracking-[0.25em] text-arena-300 uppercase">
                {t('arena.friends.offline', { n: offline.length })}
              </h2>
              <div className="space-y-2">
                {offline.map((friend) => (
                  <FriendRow key={friend.username} friend={friend} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* =================================================== right column */}
        <div className="space-y-6">
          {/* add friend */}
          <form
            className="border border-white/[0.07] bg-arena-800 p-5"
            onSubmit={sendRequest}
          >
            <h2 className="mb-4 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
              {t('arena.friends.add')}
            </h2>
            <label className="sr-only" htmlFor="add-friend">
              {t('arena.friends.usernameLabel')}
            </label>
            <input
              id="add-friend"
              type="text"
              value={addName}
              onChange={(e) => {
                setAddName(e.target.value);
                setAddNotice(null);
              }}
              autoComplete="off"
              disabled={sending}
              placeholder={t('arena.friends.usernamePlaceholder')}
              className="mb-3 w-full border border-white/10 bg-arena-750 px-3 py-2.5 text-sm text-white outline-none placeholder:text-arena-400 focus:border-gold/40"
            />
            <button
              type="submit"
              disabled={!canSendRequest || sending}
              className={`w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                canSendRequest && !sending
                  ? 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
                  : 'cursor-not-allowed bg-arena-700 text-arena-400'
              }`}
            >
              {sending ? '…' : t('arena.friends.send')}
            </button>
            {/*
              A receipt for the action just taken — it names the outcome,
              including the both-asked-at-once case where sending is what
              accepts. The durable state is the panel below, which is where
              the request still is on the next visit.
            */}
            {addNotice && (
              <p
                className={`mt-3 text-[11px] ${
                  addNotice.kind === 'error' ? 'text-gold' : 'text-arena-200'
                }`}
                role={addNotice.kind === 'error' ? 'alert' : undefined}
                aria-live="polite"
              >
                {addNotice.text}
              </p>
            )}
          </form>

          {/* requests */}
          {requests.length > 0 && (
            <section className="border border-white/[0.07] bg-arena-800 p-5">
              <h2 className="mb-4 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
                {t('arena.friends.requests', { n: requests.length })}
              </h2>
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.username}
                    className="flex items-center gap-3"
                  >
                    <Avatar
                      initial={request.displayName.charAt(0).toUpperCase()}
                      username={request.username}
                      alt={request.displayName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">
                        {request.displayName}
                      </div>
                      <div className="text-[10px] tracking-wider text-arena-300 uppercase">
                        {t('arena.friends.statusPending')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => act(request, 'accept')}
                      className="cursor-pointer border border-gold/40 px-2 py-1 text-[10px] text-gold transition-colors hover:bg-gold/10 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                      aria-label={t('arena.friends.accept', {
                        name: request.displayName,
                      })}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => act(request, 'decline')}
                      className="cursor-pointer border border-arena-400 px-2 py-1 text-[10px] text-arena-300 transition-colors hover:border-arena-300 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                      aria-label={t('arena.friends.decline', {
                        name: request.displayName,
                      })}
                    >
                      ✗
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/*
            ============================================== sent requests

            The sender's half of the flow: what I have asked for and not been
            answered on, and what was turned down. Both come from
            /friends/list's `outgoing`, which the server builds from my own
            record — `outgoingRequests` for the pending ones and
            `deniedRequests` for the rest.

            Denied entries stay until the request is sent again, which clears
            them. They are deliberately not actionable: a denial is somebody
            else's answer, and the way to change it is to ask again, not to
            tidy it away.
          */}
          {outgoingSupported && outgoing.length > 0 && (
            <section className="border border-white/[0.07] bg-arena-800 p-5">
              <h2 className="mb-4 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
                {t('arena.friends.sentRequests', { n: outgoing.length })}
              </h2>
              <div className="space-y-3">
                {outgoing.map((entry) => (
                  <div key={entry.username} className="flex items-center gap-3">
                    <Avatar
                      initial={entry.displayName.charAt(0).toUpperCase()}
                      username={entry.username}
                      alt={entry.displayName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">
                        {entry.displayName}
                      </div>
                      {/* the status the record actually holds, not a guess */}
                      <div
                        className={`text-[10px] tracking-wider uppercase ${
                          entry.status === 'denied'
                            ? 'text-arena-400'
                            : 'text-gold'
                        }`}
                      >
                        {entry.status === 'denied'
                          ? t('arena.friends.statusDenied')
                          : t('arena.friends.statusPending')}
                      </div>
                      {/*
                        A denial is a wait, not a wall, and the wait has a
                        length — saying so is kinder than letting someone
                        press Send again to find out. Rounded UP, so the day
                        it names is one the request will actually go through.
                      */}
                      {entry.status === 'denied' &&
                        retryDays(entry) !== null && (
                          <div className="text-[10px] text-arena-400">
                            {t('arena.friends.retryIn', {
                              n: retryDays(entry) as number,
                            })}
                          </div>
                        )}
                    </div>
                    {/* a denied request is over; only a live one can be withdrawn */}
                    {entry.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => cancelOutgoing(entry)}
                        className="cursor-pointer border border-arena-400 px-2 py-1 text-[10px] text-arena-300 transition-colors hover:border-arena-300 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                        aria-label={t('arena.friends.cancelRequest', {
                          name: entry.displayName,
                        })}
                      >
                        ✗
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function FriendRow({ friend }: { friend: FriendSummary }) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-4 border border-white/[0.07] bg-arena-800 p-4 transition-colors hover:bg-arena-750">
      <div className="relative">
        <Avatar
          initial={(friend.displayName || friend.username)
            .charAt(0)
            .toUpperCase()}
          username={friend.username}
          alt={friend.displayName || friend.username}
          size="md"
        />
        <span
          className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-arena-800 ${friend.online ? 'bg-arena-200' : 'bg-arena-500'}`}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-white">
            {friend.displayName || friend.username}
          </span>
          {friend.currentStreak > 0 && (
            <span className="text-[10px] text-gold">
              🔥 {friend.currentStreak}
            </span>
          )}
        </div>
      </div>
      <div className="hidden text-[11px] text-arena-300 sm:block">
        {t('arena.friends.wins', { n: friend.wins })}
      </div>
      {friend.online ? (
        <button
          type="button"
          className="cursor-pointer bg-gold px-4 py-2 text-[10px] font-bold tracking-[0.15em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          aria-label={t('arena.friends.inviteName', {
            name: friend.displayName || friend.username,
          })}
        >
          {t('arena.friends.invite')}
        </button>
      ) : (
        <button
          type="button"
          className="cursor-pointer border border-arena-400 px-4 py-2 text-[10px] tracking-[0.15em] text-arena-300 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          aria-label={t('arena.friends.profileOf', {
            name: friend.displayName || friend.username,
          })}
        >
          {t('arena.friends.profile')}
        </button>
      )}
    </div>
  );
}
