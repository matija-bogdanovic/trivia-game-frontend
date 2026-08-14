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
        <div className="text-g200 text-[10px] tracking-[0.25em] uppercase mb-1">
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
            className="w-full bg-g800 border border-white/10 text-white text-sm px-4 py-3 outline-none focus:border-gold/40 placeholder:text-g400"
          />

          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-g300 mb-3">
              Online — {online.length}
            </div>
            <div className="space-y-2">
              {online.map((f) => (
                <FriendRow key={f.name} friend={f} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-g300 mb-3">
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
          <div className="bg-g800 border border-white/[0.07] p-5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-g200 mb-4">
              Add Friend
            </div>
            <input
              type="text"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              placeholder="Username..."
              className="w-full bg-g750 border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:border-gold/40 placeholder:text-g400 mb-3"
            />
            <button className="w-full bg-gold text-g950 font-bold text-[10px] tracking-[0.2em] uppercase py-3 hover:bg-gold-light transition-colors">
              SEND REQUEST
            </button>
          </div>

          {/* Friend requests */}
          {friendRequests.length > 0 && (
            <div className="bg-g800 border border-white/[0.07] p-5">
              <div className="text-[10px] tracking-[0.25em] uppercase text-g200 mb-4">
                Requests — {friendRequests.length}
              </div>
              <div className="space-y-3">
                {friendRequests.map((r) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-g600 text-white flex items-center justify-center font-bold text-sm">
                      {r.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-bold">
                        {r.name}
                      </div>
                      <div className="text-g300 text-[10px]">{r.wins} wins</div>
                    </div>
                    <button className="text-gold text-[10px] border border-gold/40 px-2 py-1 hover:bg-gold/10 transition-colors">
                      ✓
                    </button>
                    <button className="text-g300 text-[10px] border border-g400 px-2 py-1 hover:border-g300 transition-colors">
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
    <div className="bg-g800 border border-white/[0.07] p-4 flex items-center gap-4 hover:bg-g750 transition-colors">
      <div className="relative">
        <div className="w-10 h-10 bg-g600 text-white flex items-center justify-center font-bold">
          {friend.initial}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-g800 rounded-full ${
            friend.online ? 'bg-g200' : 'bg-g500'
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
          className={`text-[11px] ${friend.online ? 'text-g200' : 'text-g400'}`}
        >
          {friend.status}
        </div>
      </div>
      <div className="text-g300 text-[11px]">{friend.wins} wins</div>
      {friend.online && (
        <button className="bg-gold text-g950 font-bold text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-gold-light transition-colors">
          INVITE
        </button>
      )}
      {!friend.online && (
        <button className="border border-g400 text-g300 text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:border-g300 hover:text-white transition-colors">
          PROFILE
        </button>
      )}
    </div>
  );
}
