'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  categories,
  difficulties,
  rooms,
  type Room,
} from '@/app/(arena)/_mock/rooms';

export default function Page() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  // NOTE: carried over from the design — the dropdown below is bound to this
  // but nothing sorts by it. See the P3 report.
  const [sort, setSort] = useState('players');

  const filtered = rooms.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.host.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || r.category === category;
    const matchDiff = difficulty === 'All' || r.difficulty === difficulty;
    return matchSearch && matchCat && matchDiff;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-g200 text-[10px] tracking-[0.25em] uppercase mb-1">
          Multiplayer
        </div>
        <h1 className="text-3xl font-bold tracking-wide">FIND A ROOM</h1>
      </div>

      {/* Quick actions */}
      <div className="flex gap-4 mb-8">
        <Link
          href="/rooms/create"
          className="bg-gold text-g950 font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors"
        >
          + CREATE ROOM
        </Link>
        <Link
          href="/rooms/join"
          className="border border-white/20 text-white font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-g700 transition-colors"
        >
          → JOIN WITH CODE
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-g800 border border-white/[0.07] p-4 mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms or hosts..."
          className="bg-g750 border border-white/10 text-white text-sm px-4 py-2 outline-none focus:border-gold/40 placeholder:text-g300 w-56"
        />

        <div className="flex gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[10px] tracking-wider uppercase px-3 py-2 transition-colors ${
                category === c
                  ? 'bg-gold text-g950 font-bold'
                  : 'text-g200 border border-white/10 hover:border-g300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`text-[10px] tracking-wider uppercase px-3 py-2 transition-colors ${
                difficulty === d
                  ? 'bg-g600 text-white font-bold border border-g400'
                  : 'text-g200 border border-white/10 hover:border-g300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-g750 border border-white/10 text-g200 text-[10px] tracking-wider uppercase px-3 py-2 outline-none ml-auto"
        >
          <option value="players">Sort: Players</option>
          <option value="money">Sort: Money</option>
          <option value="difficulty">Sort: Difficulty</option>
        </select>
      </div>

      {/* Room count */}
      <div className="text-g200 text-[10px] tracking-wider uppercase mb-4">
        {filtered.length} ROOMS AVAILABLE
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-g300">
          <div className="text-4xl mb-4">◎</div>
          <div className="text-sm tracking-wider uppercase">
            No rooms match your filters
          </div>
        </div>
      )}
    </div>
  );
}

function RoomCard({ room }: { room: Room }) {
  const spots = room.maxPlayers - room.players;
  const full = spots === 0;

  return (
    <div
      className={`bg-g800 border border-white/[0.07] p-5 hover:bg-g750 transition-colors ${full ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-white font-bold tracking-wide mb-1">
            {room.name}
          </div>
          <div className="text-g200 text-[11px] tracking-wider">
            Hosted by <span className="text-white">{room.host}</span>
            {room.hostStreak > 0 && (
              <span className="text-gold ml-2">🔥 {room.hostStreak}</span>
            )}
          </div>
        </div>
        <div className="text-[10px] tracking-wider uppercase text-g300 border border-g400 px-2 py-1">
          PUBLIC
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Players" value={`${room.players} / ${room.maxPlayers}`} />
        <Stat
          label="Starting Money"
          value={`$${room.money.toLocaleString()}`}
          accent
        />
        <Stat label="Category" value={room.category} />
        <Stat label="Difficulty" value={room.difficulty} />
      </div>

      {/* Player bar */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: room.maxPlayers }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 ${i < room.players ? 'bg-gold' : 'bg-g600'}`}
          />
        ))}
      </div>

      {full ? (
        <button
          disabled
          className="w-full font-bold text-[11px] tracking-[0.2em] uppercase py-3 bg-g700 text-g300 cursor-not-allowed"
        >
          ROOM FULL
        </button>
      ) : (
        <Link
          href="/lobby"
          className="block text-center w-full font-bold text-[11px] tracking-[0.2em] uppercase py-3 transition-colors bg-gold text-g950 hover:bg-gold-light"
        >
          JOIN ROOM →
        </Link>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-g300 text-[9px] tracking-[0.2em] uppercase mb-0.5">
        {label}
      </div>
      <div
        className={`text-sm font-bold ${accent ? 'text-gold' : 'text-white'}`}
      >
        {value}
      </div>
    </div>
  );
}
