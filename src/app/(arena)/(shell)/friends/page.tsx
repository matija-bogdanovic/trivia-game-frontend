'use client';

import { useEffect, useState } from 'react';
import Avatar from '@/app/(arena)/_components/avatar';
import PageHeader from '@/app/(arena)/_components/page_header';
import { useT } from '@/app/lib/i18n';
import { apiFetch } from '@/app/helpers/api';
import { getIdentity } from '@/app/helpers/token_operations';

/** A row of POST /friends/list. `online` is degraded while the game is not serverless. */
interface Friend {
  username: string;
  displayName: string;
  online: boolean;
  points: number;
  currentStreak: number;
  wins: number;
}

/**
 * POST /friends/list returns `requests` as bare usernames — `requests:
 * [username]` in the handler's contract, read straight off me.friendRequests.
 * It was typed as an object here, so nameOf() resolved every row to the empty
 * string: the rows rendered blank and accept/decline posted target: "", which
 * the backend answers with 400 "target and action required". The panel has
 * never worked. The object form is tolerated in case the shape ever grows.
 */
type FriendRequest = string | { username?: string; name?: string };

/**
 * Friend list, search and incoming requests.
 *
 * The export rendered the accept/decline buttons and the "send request" form
 * without wiring any of them, so every control was inert. They act on the list
 * here, as in the Angular app.
 */
export default function Page() {
  const { t } = useT();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
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
      try {
        const res = await apiFetch('/friends/list');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setFriends(data.friends ?? []);
            setRequests(data.requests ?? []);
          }
        }
      } catch {
        // the list just stays empty
      } finally {
        if (!cancelled) setLoading(false);
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
    try {
      const res = await apiFetch('/friends/list');
      if (!res.ok) return;
      const data = await res.json();
      setFriends(data.friends ?? []);
      setRequests(data.requests ?? []);
    } catch {
      // the list just stays as it was
    }
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
    try {
      const res = await apiFetch('/friends/action', {
        body: { target: name, action: 'request' },
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const accepted = data.status === 'accepted';
        setAddNotice({
          kind: accepted ? 'accepted' : 'sent',
          text: accepted
            ? t('arena.friends.nowFriends', { name })
            : t('arena.friends.requestSent', { name }),
        });
        setAddName('');
        await reload();
      } else {
        const reason = String(data.message ?? '');
        const key =
          reason === "That's you"
            ? 'arena.friends.errSelf'
            : reason === 'User not found'
              ? 'arena.friends.errNoUser'
              : reason === 'Already friends'
                ? 'arena.friends.errAlready'
                : reason === 'Request already sent'
                  ? 'arena.friends.errPending'
                  : 'arena.friends.errFailed';
        setAddNotice({ kind: 'error', text: t(key, { name }) });
      }
    } catch {
      setAddNotice({ kind: 'error', text: t('arena.friends.errUnreachable') });
    } finally {
      setSending(false);
    }
  };

  const nameOf = (r: FriendRequest): string =>
    typeof r === 'string' ? r : (r.username ?? r.name ?? '');

  const act = async (request: FriendRequest, action: 'accept' | 'decline') => {
    const target = nameOf(request);
    setRequests((current) => current.filter((r) => nameOf(r) !== target));
    if (!target) return;
    try {
      await apiFetch('/friends/action', { body: { target, action } });
      // accepting adds a friend row, so the list has to come back
      if (action === 'accept') await reload();
    } catch {
      // optimistic — the list reloads on the next visit
    }
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

          {loading && (
            <div className="py-8 text-center text-[11px] tracking-wider text-arena-300 uppercase">
              {t('arena.common.loading')}
            </div>
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
              A receipt for the action just taken, not a durable state. The
              backend records a request only on the RECIPIENT's wallet, so
              there is nothing to read back that would say "still pending" on
              a later visit — see the note above the friend list.
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
                    key={nameOf(request)}
                    className="flex items-center gap-3"
                  >
                    <Avatar
                      initial={nameOf(request).charAt(0).toUpperCase()}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">
                        {nameOf(request)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => act(request, 'accept')}
                      className="cursor-pointer border border-gold/40 px-2 py-1 text-[10px] text-gold transition-colors hover:bg-gold/10 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                      aria-label={t('arena.friends.accept', {
                        name: nameOf(request),
                      })}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => act(request, 'decline')}
                      className="cursor-pointer border border-arena-400 px-2 py-1 text-[10px] text-arena-300 transition-colors hover:border-arena-300 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                      aria-label={t('arena.friends.decline', {
                        name: nameOf(request),
                      })}
                    >
                      ✗
                    </button>
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

function FriendRow({ friend }: { friend: Friend }) {
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
