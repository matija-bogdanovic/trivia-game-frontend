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

interface FriendRequest {
  username?: string;
  name?: string;
}

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
  const [sentTo, setSentTo] = useState<string | null>(null);

  const term = search.trim().toLowerCase();
  const matching = term
    ? friends.filter((f) =>
        (f.displayName || f.username).toLowerCase().includes(term)
      )
    : friends;
  const online = matching.filter((f) => f.online);
  const offline = matching.filter((f) => !f.online);
  const canSendRequest = addName.trim().length > 0;

  const sendRequest = (event: React.FormEvent) => {
    event.preventDefault();
    const name = addName.trim();
    if (!name) return;
    setSentTo(name);
    setAddName('');
  };

  const nameOf = (r: FriendRequest) => r.username ?? r.name ?? '';

  const act = async (request: FriendRequest, action: 'accept' | 'decline') => {
    const target = nameOf(request);
    setRequests((current) => current.filter((r) => nameOf(r) !== target));
    try {
      await apiFetch('/friends/action', { body: { target, action } });
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
                setSentTo(null);
              }}
              placeholder={t('arena.friends.usernamePlaceholder')}
              className="mb-3 w-full border border-white/10 bg-arena-750 px-3 py-2.5 text-sm text-white outline-none placeholder:text-arena-400 focus:border-gold/40"
            />
            <button
              type="submit"
              disabled={!canSendRequest}
              className={`w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                canSendRequest
                  ? 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
                  : 'cursor-not-allowed bg-arena-700 text-arena-400'
              }`}
            >
              {t('arena.friends.send')}
            </button>
            <p className="mt-3 text-[11px] text-arena-200" aria-live="polite">
              {sentTo && (
                <>
                  {t('arena.friends.sentTo')}{' '}
                  <span className="font-bold text-gold">{sentTo}</span>.
                </>
              )}
            </p>
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
