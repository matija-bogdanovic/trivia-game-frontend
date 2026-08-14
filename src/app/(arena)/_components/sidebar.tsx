'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import { getIdentity } from '@/app/helpers/token_operations';
import { ME } from '@/app/(arena)/_mock/progress';
import LogoPlaceholder from './logo_placeholder';
import { navItems } from './nav_items';

/**
 * Translated from the Angular app's shell/nav. Two separate trees, as there:
 * a fixed sidebar from lg up, and a top bar with a horizontally scrolling
 * link strip below it — which is what makes the arena usable on a phone.
 *
 * routerLinkActive with {exact: true} becomes an exact pathname compare, so
 * /rooms does not stay lit while you are on /rooms/create.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    getIdentity().then((id) => setDisplayName(id?.displayName ?? null));
  }, []);

  const name = displayName ?? 'Not signed in';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '·';

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      router.push('/login');
    }
  };

  return (
    <>
      {/* ================================================= desktop sidebar */}
      <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-white/[0.07] bg-arena-950 lg:flex">
        <div className="border-b border-white/[0.07] px-5 py-6">
          <div className="mb-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase">
            Multiplayer
          </div>
          {/* TODO(logo): real artwork goes in <LogoPlaceholder> */}
          <div className="h-8">
            <LogoPlaceholder />
          </div>
        </div>

        <nav
          className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4"
          aria-label="Main"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  active
                    ? 'border-l-2 border-gold bg-arena-600 text-white'
                    : 'text-arena-200 hover:bg-arena-700 hover:text-white'
                }`}
              >
                <span
                  className={`w-4 text-center text-xs font-bold ${active ? 'text-gold' : 'text-arena-300'}`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="text-[11px] tracking-wider uppercase">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3">
          <Link
            href="/rooms"
            className="block w-full bg-gold py-3 text-center text-[11px] font-bold tracking-[0.15em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-950 focus-visible:outline-none"
          >
            ▶ Play now
          </Link>
        </div>

        <div className="flex items-center border-t border-white/[0.07]">
          <Link
            href="/profile"
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-arena-900 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center bg-gold text-sm font-bold text-arena-950"
              aria-hidden="true"
            >
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-white">
                {name}
              </span>
              <span className="block text-[10px] tracking-wider text-gold">
                🔥 {ME.streak} streak
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="mr-2 cursor-pointer px-2 py-2 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            aria-label="Sign out"
            title="Sign out"
          >
            <span className="text-sm" aria-hidden="true">
              ⏻
            </span>
          </button>
        </div>
      </aside>

      {/* ================================================== mobile top bar */}
      <div className="shrink-0 border-b border-white/[0.07] bg-arena-950 lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* TODO(logo): real artwork goes in <LogoPlaceholder> */}
          <div className="h-7">
            <LogoPlaceholder />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/rooms"
              className="bg-gold px-4 py-2 text-[10px] font-bold tracking-[0.15em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              ▶ Play
            </Link>
            <Link
              href="/profile"
              className="flex h-8 w-8 shrink-0 items-center justify-center bg-gold text-sm font-bold text-arena-950 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              aria-label={`${name} profile`}
            >
              {initial}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer px-1 py-2 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              aria-label="Sign out"
            >
              <span className="text-sm" aria-hidden="true">
                ⏻
              </span>
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Main">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 px-3 py-2 text-[10px] tracking-wider whitespace-nowrap uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  active
                    ? 'bg-arena-600 text-white'
                    : 'text-arena-200 hover:bg-arena-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
