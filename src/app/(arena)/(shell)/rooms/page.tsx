'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import PageHeader from '@/app/(arena)/_components/page_header';
import { money } from '@/app/(arena)/_lib/money';
import {
  filterCategories,
  filterDifficulties,
  rooms,
  type Room,
} from '@/app/(arena)/_mock/rooms';

type RoomSort = 'players' | 'money' | 'difficulty';

const SORT_OPTIONS: { value: RoomSort; label: string }[] = [
  { value: 'players', label: 'Sort: Players' },
  { value: 'money', label: 'Sort: Money' },
  { value: 'difficulty', label: 'Sort: Difficulty' },
];

/** Ordering used by the difficulty sort; "Mixed" reads as hardest-unknown. */
const DIFFICULTY_RANK: Record<string, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  Mixed: 3,
};

function sorted(list: Room[], sort: RoomSort): Room[] {
  const copy = [...list];
  switch (sort) {
    case 'money':
      return copy.sort((a, b) => b.money - a.money);
    case 'difficulty':
      return copy.sort(
        (a, b) =>
          (DIFFICULTY_RANK[a.difficulty] ?? 0) -
          (DIFFICULTY_RANK[b.difficulty] ?? 0)
      );
    default:
      // fullest rooms first — the ones about to start are the interesting ones
      return copy.sort((a, b) => b.players - a.players);
  }
}

/**
 * Room browser, translated from the Angular app.
 *
 * The export kept `sort` in state and rendered the dropdown but never applied
 * it — picking an option re-rendered the identical list. The sort is real
 * here, and a "clear filters" affordance appears once anything is narrowing.
 */
export default function Page() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [sort, setSort] = useState<RoomSort>('players');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matched = rooms.filter((room) => {
      const matchesTerm =
        !term ||
        room.name.toLowerCase().includes(term) ||
        room.host.toLowerCase().includes(term);
      const matchesCategory = category === 'All' || room.category === category;
      const matchesDifficulty =
        difficulty === 'All' || room.difficulty === difficulty;
      return matchesTerm && matchesCategory && matchesDifficulty;
    });
    return sorted(matched, sort);
  }, [search, category, difficulty, sort]);

  const hasFilters =
    search.trim() !== '' || category !== 'All' || difficulty !== 'All';

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setDifficulty('All');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Multiplayer" title="FIND A ROOM" />

      {/* =================================================== quick actions */}
      <div className="mb-8 flex flex-wrap gap-3 sm:gap-4">
        <Link
          href="/rooms/create"
          className="bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          + Create room
        </Link>
        <Link
          href="/rooms/join"
          className="border border-white/20 px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          → Join with code
        </Link>
      </div>

      {/* ========================================================== filters */}
      <div className="mb-6 flex flex-col gap-4 border border-white/[0.07] bg-arena-800 p-4 xl:flex-row xl:flex-wrap xl:items-center">
        <label className="sr-only" htmlFor="room-search">
          Search rooms or hosts
        </label>
        <input
          id="room-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms or hosts..."
          className="w-full border border-white/10 bg-arena-750 px-4 py-2 text-sm text-white outline-none placeholder:text-arena-300 focus:border-gold/40 xl:w-56"
        />

        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Filter by category"
        >
          {filterCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`cursor-pointer px-3 py-2 text-[10px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                category === c
                  ? 'bg-gold font-bold text-arena-950'
                  : 'border border-white/10 text-arena-200 hover:border-arena-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Filter by difficulty"
        >
          {filterDifficulties.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
              className={`cursor-pointer px-3 py-2 text-[10px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                difficulty === d
                  ? 'border border-arena-400 bg-arena-600 font-bold text-white'
                  : 'border border-white/10 text-arena-200 hover:border-arena-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="room-sort">
          Sort rooms
        </label>
        <select
          id="room-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as RoomSort)}
          className="cursor-pointer border border-white/10 bg-arena-750 px-3 py-2 text-[10px] tracking-wider text-arena-200 uppercase outline-none focus:border-gold/40 xl:ml-auto"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* ============================================================ count */}
      <div
        className="mb-4 flex items-center gap-4 text-[10px] tracking-wider text-arena-200 uppercase"
        aria-live="polite"
      >
        <span>{visible.length} rooms available</span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="cursor-pointer text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ============================================================ rooms */}
      <div className="grid gap-4 xl:grid-cols-2">
        {visible.map((room) => {
          const full = room.maxPlayers - room.players === 0;
          return (
            <article
              key={room.id}
              className={`border border-white/[0.07] bg-arena-800 p-5 transition-colors hover:bg-arena-750 ${full ? 'opacity-60' : ''}`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="mb-1 truncate font-bold tracking-wide text-white">
                    {room.name}
                  </h2>
                  <div className="text-[11px] tracking-wider text-arena-200">
                    Hosted by <span className="text-white">{room.host}</span>
                    {room.hostStreak > 0 && (
                      <span className="ml-2 text-gold">
                        🔥 {room.hostStreak}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 border border-arena-400 px-2 py-1 text-[10px] tracking-wider text-arena-300 uppercase">
                  Public
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-0.5 text-[9px] tracking-[0.2em] text-arena-300 uppercase">
                    Players
                  </div>
                  <div className="text-sm font-bold text-white tabular-nums">
                    {room.players} / {room.maxPlayers}
                  </div>
                </div>
                <div>
                  <div className="mb-0.5 text-[9px] tracking-[0.2em] text-arena-300 uppercase">
                    Starting Money
                  </div>
                  <div className="text-sm font-bold text-gold tabular-nums">
                    {money(room.money)}
                  </div>
                </div>
                <div>
                  <div className="mb-0.5 text-[9px] tracking-[0.2em] text-arena-300 uppercase">
                    Category
                  </div>
                  <div className="text-sm font-bold text-white">
                    {room.category}
                  </div>
                </div>
                <div>
                  <div className="mb-0.5 text-[9px] tracking-[0.2em] text-arena-300 uppercase">
                    Difficulty
                  </div>
                  <div className="text-sm font-bold text-white">
                    {room.difficulty}
                  </div>
                </div>
              </div>

              {/* capacity bar */}
              <div className="mb-4 flex gap-1" aria-hidden="true">
                {Array.from({ length: room.maxPlayers }, (_, seat) => (
                  <div
                    key={seat}
                    className={`h-1 flex-1 ${seat < room.players ? 'bg-gold' : 'bg-arena-600'}`}
                  />
                ))}
              </div>

              {full ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed bg-arena-700 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-300 uppercase"
                >
                  Room full
                </button>
              ) : (
                <Link
                  href="/rooms/join"
                  className="block w-full bg-gold py-3 text-center text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  Join room →
                </Link>
              )}
            </article>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="py-20 text-center text-arena-300">
          <div className="mb-4 text-4xl" aria-hidden="true">
            ◎
          </div>
          <div className="text-sm tracking-wider uppercase">
            No rooms match your filters
          </div>
        </div>
      )}
    </div>
  );
}
