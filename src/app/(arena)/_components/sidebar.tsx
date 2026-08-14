'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getIdentity } from '@/app/helpers/token_operations';
import { navItems } from './nav_items';

/**
 * The arena shell's left rail. Ported from the design export's Nav, with its
 * local view-switcher state swapped for real routing.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    getIdentity().then((id) => setDisplayName(id?.displayName ?? null));
  }, []);

  return (
    <aside className="flex flex-col w-56 bg-g950 border-r border-white/[0.07] flex-shrink-0 h-full">
      <div className="px-5 py-6 border-b border-white/[0.07]">
        <div className="text-g300 text-[10px] tracking-[0.2em] uppercase mb-1">
          Multiplayer
        </div>
        <Link
          href="/home"
          className="block text-lg font-bold tracking-widest text-white"
        >
          IPAK SE OKREĆE
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors rounded-sm ${
                active
                  ? 'bg-g600 text-white border-l-2 border-gold'
                  : 'text-g200 hover:bg-g700 hover:text-white'
              }`}
            >
              <span
                className={`text-xs w-4 text-center font-bold ${active ? 'text-gold' : 'text-g300'}`}
              >
                {item.icon}
              </span>
              <span className="tracking-wider uppercase text-[11px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/live-game"
          className="block text-center w-full bg-gold text-g950 font-bold text-[11px] tracking-[0.15em] uppercase py-3 hover:bg-gold-light transition-colors"
        >
          ▶ PLAY NOW
        </Link>
      </div>

      {/* streak comes from the wallet the game server hydrates — wired in P3 */}
      <div className="border-t border-white/[0.07] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-gold flex items-center justify-center text-g950 font-bold text-sm flex-shrink-0">
          {displayName ? displayName[0].toUpperCase() : '·'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-bold truncate">
            {displayName ?? 'Not signed in'}
          </div>
          <Link
            href="/profile"
            className="text-gold text-[10px] tracking-wider hover:text-gold-light"
          >
            VIEW PROFILE
          </Link>
        </div>
      </div>
    </aside>
  );
}
