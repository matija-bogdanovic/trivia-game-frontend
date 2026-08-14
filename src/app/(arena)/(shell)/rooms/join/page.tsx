'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/app/helpers/api';
import { getPort } from '@/app/helpers/port';
import { getUsername } from '@/app/helpers/token_operations';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();

/**
 * The arena Join Room design on the real join flow: POST /joinRoom with a
 * six-digit code, then into /game/<lobbyId>.
 *
 * The design's public-room list was a local array; it now comes from
 * GET /lobbies, which only returns rooms still in lobby or countdown.
 * Room codes really are six digits, so the digit boxes map cleanly.
 */
interface Lobby {
  lobbyId: string;
  code: number;
  roomName: string;
  isPrivate: boolean;
  playerCount: number;
  phase: string;
  isLive: boolean;
}

export default function Page() {
  const router = useRouter();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [lobbiesLoaded, setLobbiesLoaded] = useState(false);

  useEffect(() => {
    fetch(`${getPort()}/lobbies`)
      .then((res) => (res.ok ? res.json() : { lobbies: [] }))
      .then((data) => setLobbies(data.lobbies ?? []))
      .catch(() => setLobbies([]))
      .finally(() => setLobbiesLoaded(true));
  }, []);

  const handleDigit = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[index] = val;
    setDigits(next);
    setError('');
    if (val && index < 5) {
      const inputs =
        document.querySelectorAll<HTMLInputElement>('.digit-input');
      inputs[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const inputs =
        document.querySelectorAll<HTMLInputElement>('.digit-input');
      inputs[index - 1]?.focus();
    }
  };

  /** shared by the code box and the public-room Join buttons */
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

  const codeComplete = digits.every((d) => d !== '');

  const handleJoin = () => {
    if (!codeComplete) {
      setError('Please enter all 6 digits');
      return;
    }
    join(digits.join(''), needPassword ? password : undefined);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
          Multiplayer
        </div>
        <h1 className="text-3xl font-bold tracking-wide">JOIN A ROOM</h1>
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Code entry */}
        <div className="col-span-2">
          <div className="bg-arena-800 border border-white/[0.07] p-8">
            <div className="text-arena-200 text-[11px] tracking-[0.25em] uppercase mb-6">
              Enter Room Code
            </div>
            <div className="flex gap-3 justify-center mb-6">
              {digits.map((d, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={joining}
                  className={`digit-input w-12 h-14 bg-arena-750 text-center text-2xl font-bold border outline-none transition-colors ${
                    error && !d
                      ? 'border-red-500/50 text-white'
                      : d
                        ? 'border-gold/50 text-gold'
                        : 'border-white/10 text-white focus:border-gold/40'
                  } ${i === 2 ? 'mr-2' : ''}`}
                />
              ))}
            </div>

            {needPassword && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Room password"
                className="w-full bg-arena-750 border border-white/10 text-white text-sm px-4 py-3 mb-4 outline-none focus:border-gold/40 placeholder:text-arena-400"
              />
            )}

            {error && (
              <div className="text-center text-[11px] text-arena-100 mb-4 tracking-wider">
                {error}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className={`w-full font-bold text-[11px] tracking-[0.2em] uppercase py-4 transition-colors ${
                codeComplete && !joining
                  ? 'bg-gold text-arena-950 hover:bg-gold-light'
                  : 'bg-arena-700 text-arena-400 cursor-not-allowed'
              }`}
            >
              {joining ? '…' : 'JOIN ROOM →'}
            </button>

            <div className="mt-6 pt-6 border-t border-white/[0.07] text-center">
              <div className="text-arena-300 text-[10px] tracking-wider uppercase mb-3">
                Or create your own
              </div>
              <Link
                href="/rooms/create"
                className="text-gold text-[11px] tracking-wider uppercase hover:text-gold-light"
              >
                + CREATE A ROOM
              </Link>
            </div>
          </div>
        </div>

        {/* Public rooms */}
        <div className="col-span-3">
          <div className="text-arena-200 text-[11px] tracking-[0.25em] uppercase mb-4">
            Open Rooms
          </div>
          <div className="space-y-3">
            {lobbies.map((room) => (
              <div
                key={room.lobbyId}
                className="bg-arena-800 border border-white/[0.07] p-5 flex items-center gap-5 hover:bg-arena-750 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="text-white font-bold tracking-wide truncate">
                      {room.roomName}
                    </div>
                    <div className="text-[9px] tracking-widest text-arena-300 border border-arena-400 px-2 py-0.5">
                      {room.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                    </div>
                  </div>
                  <div className="text-arena-200 text-[11px] tracking-wider">
                    Code <span className="text-gold">{room.code}</span>
                    <span className="mx-2">·</span>
                    {room.phase === 'countdown' ? 'Starting' : 'Waiting'}
                  </div>
                </div>
                <div className="text-center min-w-[60px]">
                  <div className="text-white font-bold">
                    {room.playerCount}/6
                  </div>
                  <div className="text-arena-300 text-[10px]">players</div>
                </div>
                <button
                  onClick={() => join(String(room.code))}
                  disabled={joining}
                  className="bg-gold text-arena-950 font-bold text-[10px] tracking-[0.2em] uppercase px-5 py-3 hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  JOIN →
                </button>
              </div>
            ))}

            {lobbiesLoaded && lobbies.length === 0 && (
              <div className="bg-arena-800 border border-white/[0.07] p-8 text-center">
                <div className="text-4xl mb-3 text-arena-500">◎</div>
                <div className="text-arena-300 text-[11px] tracking-wider uppercase">
                  No open rooms right now
                </div>
                <Link
                  href="/rooms/create"
                  className="inline-block mt-4 text-gold text-[11px] tracking-wider uppercase hover:text-gold-light"
                >
                  + CREATE THE FIRST ONE
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
