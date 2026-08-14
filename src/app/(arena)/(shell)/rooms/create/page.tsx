'use client';

import Link from 'next/link';
import PageHeader from '@/app/(arena)/_components/page_header';
import { money } from '@/app/(arena)/_lib/money';
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
      <div className="max-w-2xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          Room Created
        </div>
        <div className="mb-6 border border-gold/20 bg-arena-800 p-6 text-center sm:p-8">
          <div className="text-arena-200 text-[11px] tracking-[0.3em] uppercase mb-4">
            Room Code
          </div>
          <div className="mb-6 text-4xl font-bold tracking-[0.2em] text-gold tabular-nums sm:text-6xl sm:tracking-[0.3em]">
            {created.roomCode}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={copyCode}
              className="border border-gold/40 text-gold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold/10 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy code'}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            {copied ? 'Room code copied to clipboard' : ''}
          </p>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 border border-white/[0.07] bg-arena-750 p-5 text-center sm:grid-cols-3">
          <Recap label="Starting Money" value={money(500)} />
          <Recap label="Seats" value="2–6 Players" />
          <Recap
            label="Visibility"
            value={visibility === 'private' ? 'Private' : 'Public'}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/game/${created.lobbyId}`}
            className="bg-gold text-arena-950 font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
          >
            Enter lobby →
          </Link>
          <button
            onClick={() => router.push('/rooms')}
            className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-arena-700 transition-colors"
          >
            Back to rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Multiplayer" title="CREATE ROOM" />
        {credits !== null && (
          <div className="mb-6 text-right">
            <div className="text-[10px] tracking-[0.2em] text-arena-300 uppercase">
              Lobby Credits
            </div>
            <div className="text-2xl font-bold text-gold tabular-nums">
              {credits}
            </div>
          </div>
        )}
      </div>

      {/* Room Name */}
      <Section label="Room Name" htmlFor="room-name">
        <input
          id="room-name"
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value.toUpperCase())}
          className="bg-arena-750 border border-white/10 text-white text-xl font-bold tracking-widest px-5 py-4 w-full outline-none focus:border-gold/40 placeholder:text-arena-400 uppercase"
          placeholder="ARENA NAME"
          maxLength={NAME_MAX}
          disabled={creating}
        />
        <div className="text-arena-300 text-[10px] mt-2 tracking-wider">
          {NAME_MIN}–{NAME_MAX} characters
        </div>
      </Section>

      {/* Visibility */}
      <Section label="Room Visibility" id="visibility-label">
        <div
          className="grid gap-4 sm:grid-cols-2"
          role="group"
          aria-labelledby="visibility-label"
        >
          {(['public', 'private'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              disabled={creating}
              aria-pressed={visibility === v}
              className={`p-5 border text-left transition-colors ${
                visibility === v
                  ? 'border-gold/40 bg-gold/10'
                  : 'border-white/10 bg-arena-750 hover:bg-arena-700'
              } focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none`}
            >
              <div
                className={`font-bold tracking-widest text-sm mb-1 ${visibility === v ? 'text-gold' : 'text-white'}`}
              >
                {v === 'public' ? '◇ PUBLIC' : '◈ PRIVATE'}
              </div>
              <div className="text-arena-200 text-[11px] leading-relaxed">
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
            className="mt-4 bg-arena-750 border border-white/10 text-white text-sm px-4 py-3 w-full outline-none focus:border-gold/40 placeholder:text-arena-400"
            disabled={creating}
          />
        )}
      </Section>

      {/* What the server fixes */}
      <Section
        label="Room Rules"
        sublabel="Set by the game server — not configurable per room yet"
      >
        <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
          <Recap label="Starting Money" value={money(500)} />
          <Recap label="Seats" value="2–6 Players" />
          <Recap label="Difficulty" value="Scales with your chain" />
        </div>
      </Section>

      {error && (
        <div className="bg-arena-800 border border-gold/40 text-arena-100 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-2">
        <button
          onClick={createRoom}
          disabled={creating || credits === 0}
          className={`font-bold text-[11px] tracking-[0.2em] uppercase px-10 py-4 transition-colors ${
            creating || credits === 0
              ? 'bg-arena-700 text-arena-400 cursor-not-allowed'
              : 'bg-gold text-arena-950 hover:bg-gold-light'
          }`}
        >
          {creating ? 'Creating…' : 'Create room →'}
        </button>
        <Link
          href="/home"
          className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-arena-700 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

function Section({
  label,
  sublabel,
  htmlFor,
  id,
  children,
}: {
  label: string;
  sublabel?: string;
  /** renders the heading as a <label> for a single control */
  htmlFor?: string;
  /** id for aria-labelledby when the section wraps a group */
  id?: string;
  children: React.ReactNode;
}) {
  const heading = 'text-[11px] font-bold tracking-[0.2em] text-white uppercase';
  return (
    <section className="border border-white/[0.07] bg-arena-800 p-6">
      <div className="mb-4">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={`block ${heading}`}>
            {label}
          </label>
        ) : (
          <div id={id} className={heading}>
            {label}
          </div>
        )}
        {sublabel && (
          <div className="mt-0.5 text-[10px] text-arena-300">{sublabel}</div>
        )}
      </div>
      {children}
    </section>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[10px] tracking-wider text-arena-300 uppercase">
        {label}
      </div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}
