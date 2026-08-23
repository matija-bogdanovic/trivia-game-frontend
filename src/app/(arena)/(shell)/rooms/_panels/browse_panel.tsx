'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import PasswordPrompt from '@/app/(arena)/_components/password_prompt';
import { apiFetch } from '@/app/helpers/api';
import { getPort } from '@/app/helpers/port';
import { getUsername } from '@/app/helpers/token_operations';
import { useT } from '@/app/lib/i18n';
import { Skeleton, SkeletonRegion } from '@/app/(arena)/_components/skeleton';
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  GlobeIcon,
  LockIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  SmileyIcon,
  UserPlusIcon,
} from '@/app/(arena)/_components/icons';

/**
 * Copy a room code, and say so.
 *
 * Its own component because the confirmation is per ROOM: the browse grid
 * renders one of these per card, and a single `copied` flag on the panel would
 * tick every card in the list at once.
 *
 * The icon becomes a tick and the word appears beside it for two seconds, then
 * it goes back. A button that changes nothing when pressed leaves the reader
 * checking their clipboard to find out whether it worked.
 *
 * ── WHEN THE CLIPBOARD IS NOT THERE ────────────────────────────────────────
 * navigator.clipboard is undefined outside a secure context and can reject on
 * a denied permission, so the tick is shown only after the write RESOLVES.
 * Claiming a copy that did not happen is worse than the silence.
 */
function CopyCode({ code }: { code: number }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(String(code)).then(
          () => setCopied(true),
          () => {}
        )
      }
      aria-label={t('arena.create.copyCode')}
      title={t('arena.create.copyCode')}
      className="inline-flex cursor-pointer items-center gap-1 p-0.5 text-arena-300 transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-ready" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5 shrink-0" />
      )}
      {/*
        aria-live rather than a re-announced label: a screen reader should hear
        "Kopirano" once when it happens, not hear the button rename itself.
      */}
      <span
        className={`text-[10px] tracking-wider text-ready uppercase ${copied ? '' : 'sr-only'}`}
        aria-live="polite"
      >
        {copied ? t('arena.create.copied') : ''}
      </span>
    </button>
  );
}

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
  /**
   * Room capacity, once the endpoint sends it. Optional because the deployed
   * /lobbies does not yet, and a room's capacity is not something to assume:
   * until it arrives the count is shown on its own rather than over a guessed
   * denominator.
   */
  maxPlayers?: number;
  phase: string;
  /**
   * Vestigial. It meant "the backend found a live in-memory game process",
   * which was only ever true on the old Express server; the Lambda hardcodes
   * it false. The count used to be hidden behind it and so was hidden always,
   * showing every room as "—" even when the roster was known. Kept in the
   * type because the endpoint still sends it.
   */
  isLive: boolean;
  /**
   * What the room is doing, from the engine's own GameState rather than
   * inferred: "waiting" is joinable, "playing" started without you.
   * Optional because a server that predates it sends nothing, and an unknown
   * status is shown as waiting — which is what the list assumed before.
   */
  status?: 'waiting' | 'playing';
  /** whether latecomers may watch; absent means yes, as every old room was */
  spectateEnabled?: boolean;
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
export default function BrowsePanel() {
  const { t } = useT();
  const router = useRouter();
  const [rooms, setRooms] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RoomSort>('newest');
  const [joining, setJoining] = useState<number | null>(null);
  const [error, setError] = useState('');
  /** the locked room the prompt is open for, and the last attempt's message */
  const [locked, setLocked] = useState<Lobby | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);

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

  /**
   * Same path as the join screen — the code is what the server joins on.
   *
   * A locked room is not an error message. 401 means the room wants a
   * password, so it opens the prompt instead of printing a line the player
   * cannot act on; 403 means the password was wrong, and that belongs in the
   * prompt too, where the retry is.
   */
  async function join(room: Lobby, withPassword?: string) {
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
        body: {
          id: username,
          roomCode: String(room.code),
          password: withPassword || undefined,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.lobbyId) {
        setLocked(null);
        router.push(`/game/${data.lobbyId}`);
        return;
      }
      if (res.status === 401) {
        // the room is private and we have not offered a password yet
        setLocked(room);
        setLockError(null);
      } else if (res.status === 403) {
        setLocked(room);
        setLockError(t('arena.join.wrongPassword'));
      } else if (res.status === 404) setError(t('arena.join.noRoom'));
      else if (res.status === 409) setError(t('arena.join.roomFull'));
      else setError(data.message ?? t('arena.join.failed'));
      setJoining(null);
    } catch {
      setError(t('arena.join.unreachable'));
      setJoining(null);
    }
  }

  return (
    <div>
      {/*
        =================================================== quick actions

        Entering a room leads, creating one follows.

        This is the BROWSE tab: everyone here is already looking at a list of
        rooms other people opened, so "get me into one" is the likelier next
        move and it takes the gold. Creating keeps its place beside it in the
        outlined style — demoted, not removed, because losing it would leave
        the tab strip as the only way to open a room from this screen.

        The label carried a typed "+" AND a PlusCircle beside it, so the
        button read "⊕ + Napravi sobu" with the plus said twice. The icon
        keeps it; the string no longer does.
      */}
      <div className="mb-8 flex flex-wrap gap-3 sm:gap-4">
        <Link
          href="/rooms/join"
          className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <UserPlusIcon className="h-4 w-4" />
          {t('arena.rooms.enterRoom')}
        </Link>
        <Link
          href="/rooms/create"
          className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <PlusCircleIcon className="h-4 w-4" />
          {t('arena.rooms.createRoom')}
        </Link>
      </div>

      {/* ========================================================== filters */}
      <div className="mb-6 flex flex-col gap-4 border border-white/[0.07] bg-arena-800 p-4 xl:flex-row xl:flex-wrap xl:items-center">
        <label className="sr-only" htmlFor="room-search">
          {t('arena.rooms.searchLabel')}
        </label>
        {/*
          The glass sits INSIDE the field, which is what makes a text box read
          as a search box before anybody types in it. The placeholder said so
          in words; a word is not a shape, and it disappears the moment there
          is a query in the field, taking the only clue with it.

          pointer-events-none on the icon: it is decoration over an input, and
          a click landing on the glyph instead of focusing the field would be
          the one thing worse than no icon at all.
        */}
        <div className="relative w-full xl:w-72">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-arena-300" />
          <input
            id="room-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('arena.rooms.searchPlaceholder')}
            className="w-full border border-white/10 bg-arena-750 py-2 pr-4 pl-10 text-sm text-white outline-none placeholder:text-arena-300 focus:border-gold/40"
          />
        </div>

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
      {/*
        Room cards in outline, on the same two-column grid: title and code,
        the two-up stat row, and the join button's full-width bar.
      */}
      {loading && (
        <SkeletonRegion className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="border border-white/[0.07] bg-arena-800 p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 shrink-0" />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                {[0, 1].map((cell) => (
                  <div key={cell} className="space-y-1.5">
                    <Skeleton className="h-2.5 w-14" />
                    <Skeleton className="h-3.5 w-10" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </SkeletonRegion>
      )}

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
                <div className="flex items-center gap-1.5 text-[11px] tracking-wider text-arena-200">
                  <span>
                    {t('arena.rooms.code')}{' '}
                    <span className="text-gold tabular-nums">{room.code}</span>
                  </span>
                  <CopyCode code={room.code} />
                </div>
              </div>
              {/*
                The status chip used to sit here, crowded against the
                visibility badge. It reads as a FACT ABOUT THE ROOM, like the
                player count, so it moved down into the stats row where the
                facts live and where it gets a heading of its own.

                Spectating stays in the header: it is a property of the room
                the way public/private is, not a changing state, and the two
                belong together.
              */}
              {room.status === 'playing' && room.spectateEnabled !== false && (
                <span
                  className="flex shrink-0 items-center gap-1 border border-frost/40 px-2 py-1 text-[10px] tracking-wider text-frost uppercase"
                  title={t('arena.rooms.spectateAllowed')}
                >
                  <EyeIcon className="h-3 w-3 shrink-0" />
                  {t('arena.rooms.spectateShort')}
                </span>
              )}
              {/*
                Public reads in frost, private in gold. Both are already the
                app's own accents, so the pair sits in the palette rather than
                beside it — and they carry opposite temperatures, which is the
                distinction: open to anyone, or shut behind a password.
              */}
              <div
                className={`flex shrink-0 items-center gap-1.5 border px-2 py-1 text-[10px] tracking-wider uppercase ${
                  room.isPrivate
                    ? 'border-gold/40 text-gold'
                    : 'border-frost/40 text-frost'
                }`}
              >
                {room.isPrivate ? (
                  <LockIcon className="h-3 w-3 shrink-0" />
                ) : (
                  <GlobeIcon className="h-3 w-3 shrink-0" />
                )}
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
                  {typeof room.maxPlayers === 'number'
                    ? `${room.playerCount} / ${room.maxPlayers}`
                    : room.playerCount}
                </div>
              </div>
              {/*
                Status, under a heading, beside the player count.

                This cell used to print "Čeka se" under a heading that also
                said "Čeka se" — the label and the value were the same string
                whenever a room was not counting down, so it filled half the
                stats row with one word said twice.

                A dot, then the words. Colour alone cannot carry this — it is
                invisible to a screen reader and to anyone who cannot separate
                green from amber — so the label says which it is and the dot is
                decoration on top.

                Three readings, two colours: a room counting down is still not
                playing, so it keeps the ready dot and only its wording
                changes. That nuance was the one thing the old cell did carry,
                and it comes along rather than being dropped.
              */}
              <div>
                <div className="mb-0.5 text-[9px] tracking-[0.2em] text-arena-300 uppercase">
                  {t('arena.rooms.statusLabel')}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] tracking-wider uppercase ${
                    room.status === 'playing'
                      ? 'border-live/40 text-live'
                      : 'border-ready/40 text-ready'
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      room.status === 'playing' ? 'bg-live' : 'bg-ready'
                    }`}
                    aria-hidden="true"
                  />
                  {room.status === 'playing'
                    ? t('arena.rooms.statusPlaying')
                    : room.phase === 'countdown'
                      ? t('arena.join.starting')
                      : t('arena.rooms.statusWaiting')}
                </span>
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

      <PasswordPrompt
        open={locked !== null}
        roomName={locked?.roomName}
        error={lockError}
        submitting={joining !== null}
        onSubmit={(password) => locked && void join(locked, password)}
        onCancel={() => {
          setLocked(null);
          setLockError(null);
          setJoining(null);
        }}
      />

      {!loading && visible.length === 0 && (
        <div className="py-20 text-center text-arena-300">
          <div className="mb-4 flex justify-center" aria-hidden="true">
            <SmileyIcon className="h-10 w-10 text-arena-500" />
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
