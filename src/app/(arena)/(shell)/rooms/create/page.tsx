'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/app/helpers/api';
import { getUsername } from '@/app/helpers/token_operations';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();

/**
 * The arena Create Room design, driving the real POST /createRoom.
 *
 * The design's other controls — starting money, max players, question
 * categories, difficulty and game mode — are not here because the game server
 * has no such settings: money (500), seats (2–6) and difficulty (scales with
 * the answer chain) are constants in room.ts, and categories and game modes do
 * not exist at all. They are surfaced read-only below as the rules a room
 * actually runs under, rather than shipped as controls that quietly do
 * nothing. See the Tier 2 report.
 */
const NAME_MIN = 4;
const NAME_MAX = 13;

interface Created {
  lobbyId: string;
  roomCode: number;
}

export default function Page() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getUsername().then(async (name) => {
      if (!name) return;
      try {
        const res = await apiFetch('/wallet');
        if (res.ok) setCredits((await res.json()).credits);
      } catch {
        // the credit readout is a nicety; creating still reports 403 itself
      }
    });
  }, []);

  async function createRoom() {
    if (roomName.trim().length < NAME_MIN) {
      setError(`Room name needs at least ${NAME_MIN} characters.`);
      return;
    }
    if (visibility === 'private' && password.length < 4) {
      setError('A private room needs a password of at least 4 characters.');
      return;
    }
    if (creating) return;

    setCreating(true);
    setError('');
    try {
      const username = await getUsername();
      const res = await apiFetch('/createRoom', {
        body: {
          playerId: username,
          roomName: roomName.trim(),
          isPrivate: visibility === 'private',
          password: visibility === 'private' ? password : undefined,
        },
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setError('Your session expired. Sign in again to create a room.');
        setCreating(false);
        return;
      }
      if (res.status === 403) {
        setCredits(data.credits ?? 0);
        const minutes = Math.ceil((data.nextCreditInMs ?? 0) / 60000);
        setError(
          `Out of lobby credits. The next one lands in about ${minutes} min.`
        );
        setCreating(false);
        return;
      }
      if (!res.ok || !data.lobbyId) {
        setError(data.error ?? 'Could not create the room. Try again.');
        setCreating(false);
        return;
      }

      if (typeof data.creditsLeft === 'number') setCredits(data.creditsLeft);
      setCreated({ lobbyId: String(data.lobbyId), roomCode: data.roomCode });
      setCreating(false);
    } catch {
      setError('Could not reach the game server.');
      setCreating(false);
    }
  }

  const copyCode = () => {
    if (!created) return;
    navigator.clipboard?.writeText(String(created.roomCode)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {}
    );
  };

  if (created) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="text-g200 text-[10px] tracking-[0.25em] uppercase mb-6">
          Room Created
        </div>
        <div className="bg-g800 border border-gold/20 p-8 text-center mb-6">
          <div className="text-g200 text-[11px] tracking-[0.3em] uppercase mb-4">
            Room Code
          </div>
          <div className="text-6xl font-bold text-gold tracking-[0.3em] mb-6">
            {created.roomCode}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={copyCode}
              className="border border-gold/40 text-gold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold/10 transition-colors"
            >
              {copied ? '✓ COPIED' : 'COPY CODE'}
            </button>
          </div>
        </div>
        <div className="bg-g750 border border-white/[0.07] p-5 mb-6 grid grid-cols-3 gap-4 text-center">
          <Recap label="Starting Money" value="$500" />
          <Recap label="Seats" value="2–6 Players" />
          <Recap
            label="Visibility"
            value={visibility === 'private' ? 'Private' : 'Public'}
          />
        </div>
        <div className="flex gap-4">
          <Link
            href={`/game/${created.lobbyId}`}
            className="bg-gold text-g950 font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
          >
            ENTER LOBBY →
          </Link>
          <button
            onClick={() => router.push('/rooms')}
            className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-g700 transition-colors"
          >
            BACK TO ROOMS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-g200 text-[10px] tracking-[0.25em] uppercase mb-1">
            Multiplayer
          </div>
          <h1 className="text-3xl font-bold tracking-wide">CREATE ROOM</h1>
        </div>
        {credits !== null && (
          <div className="text-right">
            <div className="text-g300 text-[10px] tracking-[0.2em] uppercase">
              Lobby Credits
            </div>
            <div className="text-gold text-2xl font-bold">{credits}</div>
          </div>
        )}
      </div>

      {/* Room Name */}
      <Section label="Room Name">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value.toUpperCase())}
          className="bg-g750 border border-white/10 text-white text-xl font-bold tracking-widest px-5 py-4 w-full outline-none focus:border-gold/40 placeholder:text-g400 uppercase"
          placeholder="ARENA NAME"
          maxLength={NAME_MAX}
          disabled={creating}
        />
        <div className="text-g300 text-[10px] mt-2 tracking-wider">
          {NAME_MIN}–{NAME_MAX} characters
        </div>
      </Section>

      {/* Visibility */}
      <Section label="Room Visibility">
        <div className="grid grid-cols-2 gap-4">
          {(['public', 'private'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              disabled={creating}
              className={`p-5 border text-left transition-colors ${
                visibility === v
                  ? 'border-gold/40 bg-gold/10'
                  : 'border-white/10 bg-g750 hover:bg-g700'
              }`}
            >
              <div
                className={`font-bold tracking-widest text-sm mb-1 ${visibility === v ? 'text-gold' : 'text-white'}`}
              >
                {v === 'public' ? '◇ PUBLIC' : '◈ PRIVATE'}
              </div>
              <div className="text-g200 text-[11px] leading-relaxed">
                {v === 'public'
                  ? 'Listed for anyone to find and join.'
                  : 'Only players with the code and password can join.'}
              </div>
            </button>
          ))}
        </div>
        {visibility === 'private' && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Room password (4+ characters)"
            className="mt-4 bg-g750 border border-white/10 text-white text-sm px-4 py-3 w-full outline-none focus:border-gold/40 placeholder:text-g400"
            disabled={creating}
          />
        )}
      </Section>

      {/* What the server fixes */}
      <Section
        label="Room Rules"
        sublabel="Set by the game server — not configurable per room yet"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <Recap label="Starting Money" value="$500" />
          <Recap label="Seats" value="2–6 Players" />
          <Recap label="Difficulty" value="Scales with your chain" />
        </div>
      </Section>

      {error && (
        <div className="bg-g800 border border-gold/40 text-g100 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <button
          onClick={createRoom}
          disabled={creating || credits === 0}
          className={`font-bold text-[11px] tracking-[0.2em] uppercase px-10 py-4 transition-colors ${
            creating || credits === 0
              ? 'bg-g700 text-g400 cursor-not-allowed'
              : 'bg-gold text-g950 hover:bg-gold-light'
          }`}
        >
          {creating ? 'CREATING…' : 'CREATE ROOM →'}
        </button>
        <Link
          href="/home"
          className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-g700 transition-colors"
        >
          CANCEL
        </Link>
      </div>
    </div>
  );
}

function Section({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-g800 border border-white/[0.07] p-6">
      <div className="mb-4">
        <div className="text-white text-[11px] font-bold tracking-[0.2em] uppercase">
          {label}
        </div>
        {sublabel && (
          <div className="text-g300 text-[10px] mt-0.5">{sublabel}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-g300 text-[10px] tracking-wider uppercase mb-1">
        {label}
      </div>
      <div className="text-white font-bold">{value}</div>
    </div>
  );
}
