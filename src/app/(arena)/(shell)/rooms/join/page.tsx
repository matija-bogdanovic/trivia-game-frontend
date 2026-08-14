'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import PageHeader from '@/app/(arena)/_components/page_header';
import { apiFetch } from '@/app/helpers/api';
import { getPort } from '@/app/helpers/port';
import { getUsername } from '@/app/helpers/token_operations';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();

const LENGTH = 6;

interface Lobby {
  lobbyId: string;
  code: number;
  roomName: string;
  isPrivate: boolean;
  playerCount: number;
  phase: string;
  isLive: boolean;
}

/**
 * Join a room, translated from the Angular app's join-room screen and kept on
 * the real POST /joinRoom.
 *
 * The code boxes gain what the Angular version fixed: pasting a code fills
 * every box, arrows move between them, backspace on an empty box steps back,
 * non-digits never render, and autocomplete="one-time-code" lets the browser
 * offer a code straight from the inbox. Focus moves through refs this
 * component owns rather than a global document.querySelectorAll.
 *
 * The open-rooms list is real: GET /lobbies only returns rooms still in lobby
 * or countdown, so fields the Angular fixture had but a lobby does not report
 * — host, category, difficulty, starting money — are not shown.
 */
export default function Page() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [lobbiesLoaded, setLobbiesLoaded] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch(`${getPort()}/lobbies`)
      .then((res) => (res.ok ? res.json() : { lobbies: [] }))
      .then((data) => setLobbies(data.lobbies ?? []))
      .catch(() => setLobbies([]))
      .finally(() => setLobbiesLoaded(true));
  }, []);

  const focusBox = (index: number) => {
    if (index < 0 || index >= LENGTH) return;
    const el = boxes.current[index];
    el?.focus();
    el?.select();
  };

  const write = (index: number, digit: string) =>
    setDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

  /** Shared by typing and pasting — fills forward from the first box. */
  const fill = (raw: string) => {
    const incoming = raw.replace(/\D/g, '').slice(0, LENGTH).split('');
    if (incoming.length === 0) return;
    setDigits((current) =>
      current.map((existing, i) => incoming[i] ?? existing)
    );
    focusBox(Math.min(incoming.length, LENGTH - 1));
  };

  const onInput = (index: number, value: string) => {
    setError('');
    if (value.length > 1) {
      fill(value);
      return;
    }
    const digit = value.replace(/\D/g, '').charAt(0) ?? '';
    write(index, digit);
    if (digit && index < LENGTH - 1) focusBox(index + 1);
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (digits[index] === '') {
        e.preventDefault();
        focusBox(index - 1);
        write(index - 1, '');
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(index - 1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(index + 1);
      return;
    }
    // let shortcuts through, block stray characters
    if (e.key.length === 1 && /\D/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData?.getData('text');
    if (!text) return;
    e.preventDefault();
    fill(text);
  };

  const filledCount = digits.filter((d) => d !== '').length;
  const isComplete = filledCount === LENGTH;
  const canJoin = isComplete && !joining;

  async function join(roomCode: string, withPassword?: string) {
    if (joining) return;
    setJoining(true);
    setError('');
    try {
      const username = await getUsername();
      if (!username) {
        setError('Sign in first — the server needs to know who is joining.');
        setJoining(false);
        return;
      }
      const res = await apiFetch('/joinRoom', {
        body: { id: username, roomCode, password: withPassword || undefined },
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.lobbyId) {
        router.push(`/game/${data.lobbyId}`);
        return;
      }
      if (res.status === 401) {
        setNeedPassword(true);
        setError('This room is private. Enter its password.');
      } else if (res.status === 403) {
        setError('Wrong password.');
      } else if (res.status === 404) {
        setError('No room with that code.');
      } else if (res.status === 409) {
        setError('That room is full.');
      } else {
        setError(data.message ?? 'Could not join the room.');
      }
      setJoining(false);
    } catch {
      setError('Could not reach the game server.');
      setJoining(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Multiplayer" title="JOIN A ROOM" />

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        {/* ===================================================== code entry */}
        <section className="lg:col-span-2">
          <div className="border border-white/[0.07] bg-arena-800 p-6 sm:p-8">
            <h2
              className="mb-6 text-[11px] tracking-[0.25em] text-arena-200 uppercase"
              id="code-label"
            >
              Enter Room Code
            </h2>

            <div
              className="mb-6 flex justify-center gap-2 sm:gap-3"
              role="group"
              aria-labelledby="code-label"
              onPaste={onPaste}
            >
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxes.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onInput(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  aria-label={`Digit ${i + 1} of 6`}
                  disabled={joining}
                  className={`h-12 w-10 border bg-arena-750 text-center text-2xl font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50 sm:h-14 sm:w-12 ${
                    digit
                      ? 'border-gold/50 text-gold'
                      : 'border-white/10 text-white focus:border-gold/40'
                  } ${i === 2 ? 'mr-2' : ''}`}
                />
              ))}
            </div>

            <p
              className="mb-4 text-center text-[11px] tracking-wider text-arena-300"
              aria-live="polite"
            >
              {!isComplete
                ? `${filledCount} of 6 digits entered`
                : joining
                  ? 'Joining room...'
                  : 'Code ready'}
            </p>

            {needPassword && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Room password"
                aria-label="Room password"
                className="mb-4 w-full border border-white/10 bg-arena-750 px-4 py-3 text-sm text-white outline-none placeholder:text-arena-400 focus:border-gold/40"
              />
            )}

            {error && (
              <p className="mb-4 text-center text-[11px] tracking-wider text-gold">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                join(digits.join(''), needPassword ? password : undefined)
              }
              disabled={!canJoin}
              className={`w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                canJoin
                  ? 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
                  : 'cursor-not-allowed bg-arena-700 text-arena-400'
              }`}
            >
              {joining ? '...' : 'Join room →'}
            </button>

            {filledCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDigits(Array(LENGTH).fill(''));
                  setError('');
                  focusBox(0);
                }}
                className="mt-3 w-full cursor-pointer text-[10px] tracking-wider text-arena-300 uppercase transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                Clear code
              </button>
            )}

            <div className="mt-6 border-t border-white/[0.07] pt-6 text-center">
              <div className="mb-3 text-[10px] tracking-wider text-arena-300 uppercase">
                Or create your own
              </div>
              <Link
                href="/rooms/create"
                className="text-[11px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                + Create a room
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================================== open rooms */}
        <section className="lg:col-span-3">
          <h2 className="mb-4 text-[11px] tracking-[0.25em] text-arena-200 uppercase">
            Open Rooms
          </h2>
          <div className="space-y-3">
            {lobbies.map((room) => (
              <article
                key={room.lobbyId}
                className="flex flex-col gap-4 border border-white/[0.07] bg-arena-800 p-5 transition-colors hover:bg-arena-750 sm:flex-row sm:items-center sm:gap-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-3">
                    <h3 className="truncate font-bold tracking-wide text-white">
                      {room.roomName}
                    </h3>
                    <span className="border border-arena-400 px-2 py-0.5 text-[9px] tracking-widest text-arena-300">
                      {room.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                    </span>
                  </div>
                  <div className="text-[11px] tracking-wider text-arena-200">
                    Code{' '}
                    <span className="text-gold tabular-nums">{room.code}</span>
                    <span className="mx-2">·</span>
                    {room.phase === 'countdown' ? 'Starting' : 'Waiting'}
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="min-w-[60px] text-center">
                    <div className="font-bold text-white tabular-nums">
                      {room.playerCount}/6
                    </div>
                    <div className="text-[10px] text-arena-300">players</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => join(String(room.code))}
                    disabled={joining}
                    className="cursor-pointer bg-gold px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:opacity-50"
                    aria-label={`Join ${room.roomName}`}
                  >
                    Join →
                  </button>
                </div>
              </article>
            ))}

            {lobbiesLoaded && lobbies.length === 0 && (
              <div className="border border-white/[0.07] bg-arena-800 p-8 text-center">
                <div
                  className="mb-3 text-4xl text-arena-500"
                  aria-hidden="true"
                >
                  ◎
                </div>
                <div className="text-[11px] tracking-wider text-arena-300 uppercase">
                  No open rooms right now
                </div>
                <Link
                  href="/rooms/create"
                  className="mt-4 inline-block text-[11px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  + Create the first one
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/rooms"
            className="mt-4 inline-block text-[11px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            View all public rooms →
          </Link>
        </section>
      </div>
    </div>
  );
}
