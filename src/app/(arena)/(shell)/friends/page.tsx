'use client';

import { useState } from 'react';
import {
  friendRequests,
  friends,
  type Friend,
} from '@/app/(arena)/_mock/players';

export default function Page() {
  const [search, setSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');

  const online = friends.filter(
    (f) => f.online && f.name.toLowerCase().includes(search.toLowerCase())
  );
  const offline = friends.filter(
    (f) => !f.online && f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
          Social
        </div>
        <h1 className="text-3xl font-bold tracking-wide">FRIENDS</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main friend list */}
        <div className="col-span-2 space-y-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full bg-arena-800 border border-white/10 text-white text-sm px-4 py-3 outline-none focus:border-gold/40 placeholder:text-arena-400"
          />

          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-arena-300 mb-3">
              Online — {online.length}
            </div>
            <div className="space-y-2">
              {online.map((f) => (
                <FriendRow key={f.name} friend={f} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-arena-300 mb-3">
              Offline — {offline.length}
            </div>
            <div className="space-y-2">
              {offline.map((f) => (
                <FriendRow key={f.name} friend={f} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Add friend */}
          <div className="bg-arena-800 border border-white/[0.07] p-5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200 mb-4">
              Add Friend
            </div>
            <input
              type="text"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              placeholder="Username..."
              className="w-full bg-arena-750 border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:border-gold/40 placeholder:text-arena-400 mb-3"
            />
            <button className="w-full bg-gold text-arena-950 font-bold text-[10px] tracking-[0.2em] uppercase py-3 hover:bg-gold-light transition-colors">
              SEND REQUEST
            </button>
          </div>

          {/* Friend requests */}
          {friendRequests.length > 0 && (
            <div className="bg-arena-800 border border-white/[0.07] p-5">
              <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200 mb-4">
                Requests — {friendRequests.length}
              </div>
              <div className="space-y-3">
                {friendRequests.map((r) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-arena-600 text-white flex items-center justify-center font-bold text-sm">
                      {r.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-bold">
                        {r.name}
                      </div>
                      <div className="text-arena-300 text-[10px]">
                        {r.wins} wins
                      </div>
                    </div>
                    <button className="text-gold text-[10px] border border-gold/40 px-2 py-1 hover:bg-gold/10 transition-colors">
                      ✓
                    </button>
                    <button className="text-arena-300 text-[10px] border border-arena-400 px-2 py-1 hover:border-arena-300 transition-colors">
                      ✗
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FriendRow({ friend }: { friend: Friend }) {
  return (
    <div className="bg-arena-800 border border-white/[0.07] p-4 flex items-center gap-4 hover:bg-arena-750 transition-colors">
      <div className="relative">
        <div className="w-10 h-10 bg-arena-600 text-white flex items-center justify-center font-bold">
          {friend.initial}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-arena-800 rounded-full ${
            friend.online ? 'bg-arena-200' : 'bg-arena-500'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">{friend.name}</span>
          {friend.streak > 0 && (
            <span className="text-gold text-[10px]">🔥 {friend.streak}</span>
          )}
        </div>
        <div
          className={`text-[11px] ${friend.online ? 'text-arena-200' : 'text-arena-400'}`}
        >
          {friend.status}
        </div>
      </div>
      <div className="text-arena-300 text-[11px]">{friend.wins} wins</div>
      {friend.online && (
        <button className="bg-gold text-arena-950 font-bold text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-gold-light transition-colors">
          INVITE
        </button>
      )}
      {!friend.online && (
        <button className="border border-arena-400 text-arena-300 text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:border-arena-300 hover:text-white transition-colors">
          PROFILE
        </button>
      )}
    </div>
  );
}
