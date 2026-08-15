'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/app/(arena)/_components/page_header';
import { apiFetch } from '@/app/helpers/api';
import { getPort } from '@/app/helpers/port';
import { getUsername } from '@/app/helpers/token_operations';
import { useT } from '@/app/lib/i18n';

type RoomSort = 'players' | 'newest';

const SORT_OPTIONS: { value: RoomSort; labelKey: string }[] = [
  { value: 'newest', labelKey: 'arena.rooms.sortNewest' },
  { value: 'players', labelKey: 'arena.rooms.sortPlayers' },
];

/** What GET /lobbies returns per room. */
interface Lobby {
  lobbyId: string;
  code: number;
  roomName: string;
  isPrivate: boolean;
  /** the length of the room's seat roster — a real count, not an estimate */
  playerCount: number;
  phase: string;
  /**
   * Vestigial. It meant "the backend found a live in-memory game process",
   * which was only ever true on the old Express server; the Lambda hardcodes
   * it false. The count used to be hidden behind it and so was hidden always,
   * showing every room as "—" even when the roster was known. Kept in the
   * type because the endpoint still sends it.
   */
  isLive: boolean;
  createdAt: string | null;
}

/**
 * The room browser, on the real list.
 *
 * It shows only what GET /lobbies actually returns — name, code, visibility,
 * phase and, when the backend knows it, the player count. The category,
 * difficulty, starting-money and host fields the design had are not in that
 * response, so they are not rendered and the filters that depended on them are
 * gone. Inventing them would make the list look precise and be wrong.
 */
export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const [rooms, setRooms] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RoomSort>('newest');
  const [joining, setJoining] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${getPort()}/lobbies`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setRooms(data.lobbies ?? []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matched = rooms.filter(
      (r) =>
        !term ||
        r.roomName.toLowerCase().includes(term) ||
        String(r.code).includes(term)
    );
    const copy = [...matched];
    if (sort === 'players') {
      return copy.sort((a, b) => b.playerCount - a.playerCount);
    }
    return copy.sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
    );
  }, [rooms, search, sort]);

  /** same path as the join screen — the code is what the server joins on */
  async function join(room: Lobby) {
    if (joining !== null) return;
    setJoining(room.code);
    setError('');
    try {
      const username = await getUsername();
      if (!username) {
        setError(t('arena.join.signInFirst'));
        setJoining(null);
        return;
      }
      const res = await apiFetch('/joinRoom', {
        body: { id: username, roomCode: String(room.code) },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.lobbyId) {
        router.push(`/game/${data.lobbyId}`);
        return;
      }
      if (res.status === 401) setError(t('arena.join.privateRoom'));
      else if (res.status === 404) setError(t('arena.join.noRoom'));
      else if (res.status === 409) setError(t('arena.join.roomFull'));
      else setError(data.message ?? t('arena.join.failed'));
      setJoining(null);
    } catch {
      setError(t('arena.join.unreachable'));
      setJoining(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow={t('arena.common.multiplayer')}
        title={t('arena.rooms.title')}
      />

      {/* =================================================== quick actions */}
      <div className="mb-8 flex flex-wrap gap-3 sm:gap-4">
        <Link
          href="/rooms/create"
          className="bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('arena.rooms.createRoom')}
        </Link>
        <Link
          href="/rooms/join"
          className="border border-white/20 px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('arena.rooms.joinWithCode')}
        </Link>
      </div>

      {/* ========================================================== filters */}
      <div className="mb-6 flex flex-col gap-4 border border-white/[0.07] bg-arena-800 p-4 xl:flex-row xl:flex-wrap xl:items-center">
        <label className="sr-only" htmlFor="room-search">
          {t('arena.rooms.searchLabel')}
        </label>
        <input
          id="room-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('arena.rooms.searchPlaceholder')}
          className="w-full border border-white/10 bg-arena-750 px-4 py-2 text-sm text-white outline-none placeholder:text-arena-300 focus:border-gold/40 xl:w-72"
        />

        <label className="sr-only" htmlFor="room-sort">
          {t('arena.rooms.sortLabel')}
        </label>
        <select
          id="room-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as RoomSort)}
          className="cursor-pointer border border-white/10 bg-arena-750 px-3 py-2 text-[10px] tracking-wider text-arena-200 uppercase outline-none focus:border-gold/40 xl:ml-auto"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {/* ============================================================ count */}
      <div
        className="mb-4 text-[10px] tracking-wider text-arena-200 uppercase"
        aria-live="polite"
      >
        {loading
          ? t('arena.rooms.loading')
          : t('arena.rooms.available', { n: visible.length })}
      </div>

      {error && (
        <div className="mb-4 border border-gold/40 bg-gold/10 px-4 py-3 text-[12px] text-gold">
          {error}
        </div>
      )}

      {/* ============================================================ rooms */}
      <div className="grid gap-4 xl:grid-cols-2">
        {visible.map((room) => (
          <article
            key={room.lobbyId}
            className="border border-white/[0.07] bg-arena-800 p-5 transition-colors hover:bg-arena-750"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="mb-1 truncate font-bold tracking-wide text-white">
                  {room.roomName}
                </h2>
                <div className="text-[11px] tracking-wider text-arena-200">
                  {t('arena.rooms.code')}{' '}
                  <span className="text-gold tabular-nums">{room.code}</span>
                </div>
              </div>
              <div className="shrink-0 border border-arena-400 px-2 py-1 text-[10px] tracking-wider text-arena-300 uppercase">
                {room.isPrivate
                  ? t('arena.common.private')
                  : t('arena.common.public')}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-0.5 text-[9px] tracking-[0.2em] text-arena-300 uppercase">
                  {t('arena.common.players')}
                </div>
                <div className="text-sm font-bold text-white tabular-nums">
                  {room.playerCount}
                </div>
              </div>
              <div>
                <div className="mb-0.5 text-[9px] tracking-[0.2em] text-arena-300 uppercase">
                  {t('arena.join.waiting')}
                </div>
                <div className="text-sm font-bold text-white">
                  {room.phase === 'countdown'
                    ? t('arena.join.starting')
                    : t('arena.join.waiting')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => join(room)}
              disabled={joining !== null}
              className="w-full cursor-pointer bg-gold py-3 text-center text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:opacity-50"
            >
              {joining === room.code ? '…' : t('arena.rooms.join')}
            </button>
          </article>
        ))}
      </div>

      {!loading && visible.length === 0 && (
        <div className="py-20 text-center text-arena-300">
          <div className="mb-4 text-4xl" aria-hidden="true">
            ◎
          </div>
          <div className="text-sm tracking-wider uppercase">
            {failed ? t('arena.rooms.failed') : t('arena.rooms.noneOpen')}
          </div>
          {!failed && (
            <Link
              href="/rooms/create"
              className="mt-4 inline-block text-[11px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.rooms.createFirst')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
