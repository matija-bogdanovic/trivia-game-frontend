'use client';

import Link from 'next/link';
import PageHeader from '@/app/(arena)/_components/page_header';
import { money } from '@/app/(arena)/_lib/money';
import { useT } from '@/app/lib/i18n';
import { roomCategories } from '@/app/(arena)/_mock/rooms';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/app/helpers/api';
import { getUsername } from '@/app/helpers/token_operations';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();

/**
 * The arena Create Room design, driving the real POST /createRoom.
 *
 * Starting money and difficulty are still read-only below: they really are
 * constants in the game server, so they are shown as the rules a room runs
 * under rather than as controls that quietly do nothing. Capacity is no longer
 * among them — createRoom persists maxPlayers, so it is a real choice.
 */
const NAME_MIN = 4;
const NAME_MAX = 13;

/**
 * The capacities createRoom accepts. It clamps anything outside 2–8 rather
 * than rejecting it, but offering only what it will honour means the number
 * shown on the button is the number the room gets.
 */
const CAPACITIES = [2, 3, 4, 5, 6, 7, 8] as const;
const DEFAULT_CAPACITY = 6;

interface Created {
  lobbyId: string;
  roomCode: number;
}

export default function Page() {
  const { t } = useT();
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');
  /** the question pool the room draws from; at least one is required */
  const [categories, setCategories] = useState<string[]>(['Mixed']);
  const [maxPlayers, setMaxPlayers] = useState<number>(DEFAULT_CAPACITY);
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
      setError(t('arena.create.nameTooShort', { n: NAME_MIN }));
      return;
    }
    if (visibility === 'private' && password.length < 4) {
      setError(t('arena.create.passwordShort'));
      return;
    }
    if (categories.length === 0) {
      setError(t('arena.create.needCategory'));
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
          categories,
          maxPlayers,
        },
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setError(t('arena.create.sessionExpired'));
        setCreating(false);
        return;
      }
      if (res.status === 403) {
        setCredits(data.credits ?? 0);
        const minutes = Math.ceil((data.nextCreditInMs ?? 0) / 60000);
        setError(t('arena.create.outOfCredits', { min: minutes }));
        setCreating(false);
        return;
      }
      if (!res.ok || !data.lobbyId) {
        setError(data.error ?? t('arena.create.failed'));
        setCreating(false);
        return;
      }

      if (typeof data.creditsLeft === 'number') setCredits(data.creditsLeft);
      setCreated({ lobbyId: String(data.lobbyId), roomCode: data.roomCode });
      setCreating(false);
    } catch {
      setError(t('arena.create.unreachable'));
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
          {t('arena.create.created')}
        </div>
        <div className="mb-6 border border-gold/20 bg-arena-800 p-6 text-center sm:p-8">
          <div className="text-arena-200 text-[11px] tracking-[0.3em] uppercase mb-4">
            {t('arena.common.roomCode')}
          </div>
          <div className="mb-6 text-4xl font-bold tracking-[0.2em] text-gold tabular-nums sm:text-6xl sm:tracking-[0.3em]">
            {created.roomCode}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={copyCode}
              className="border border-gold/40 text-gold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold/10 transition-colors"
            >
              {copied ? t('arena.create.copied') : t('arena.create.copyCode')}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            {copied ? t('arena.create.copiedSr') : ''}
          </p>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 border border-white/[0.07] bg-arena-750 p-5 text-center sm:grid-cols-3">
          <Recap label={t('arena.common.startingMoney')} value={money(500)} />
          <Recap
            label={t('arena.create.seats')}
            value={t('arena.create.seatsValue', { n: maxPlayers })}
          />
          <Recap
            label={t('arena.create.visibility')}
            value={
              visibility === 'private'
                ? t('arena.common.private')
                : t('arena.common.public')
            }
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/game/${created.lobbyId}`}
            className="bg-gold text-arena-950 font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
          >
            {t('arena.create.enterLobby')}
          </Link>
          <button
            onClick={() => router.push('/rooms')}
            className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-arena-700 transition-colors"
          >
            {t('arena.create.backToRooms')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow={t('arena.common.multiplayer')}
          title={t('arena.create.title')}
        />
        {credits !== null && (
          <div className="mb-6 text-right">
            <div className="text-[10px] tracking-[0.2em] text-arena-300 uppercase">
              {t('arena.create.credits')}
            </div>
            <div className="text-2xl font-bold text-gold tabular-nums">
              {credits}
            </div>
          </div>
        )}
      </div>

      {/* Room Name */}
      <Section label={t('arena.create.roomName')} htmlFor="room-name">
        <input
          id="room-name"
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value.toUpperCase())}
          className="bg-arena-750 border border-white/10 text-white text-xl font-bold tracking-widest px-5 py-4 w-full outline-none focus:border-gold/40 placeholder:text-arena-400 uppercase"
          placeholder={t('arena.create.namePlaceholder')}
          maxLength={NAME_MAX}
          disabled={creating}
        />
        <div className="text-arena-300 text-[10px] mt-2 tracking-wider">
          {t('arena.create.nameHint', { min: NAME_MIN, max: NAME_MAX })}
        </div>
      </Section>

      {/* Visibility */}
      <Section label={t('arena.create.visibility')} id="visibility-label">
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
                {v === 'public'
                  ? t('arena.create.publicLabel')
                  : t('arena.create.privateLabel')}
              </div>
              <div className="text-arena-200 text-[11px] leading-relaxed">
                {v === 'public'
                  ? t('arena.create.publicDesc')
                  : t('arena.create.privateDesc')}
              </div>
            </button>
          ))}
        </div>
        {visibility === 'private' && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('arena.create.passwordPlaceholder')}
            className="mt-4 bg-arena-750 border border-white/10 text-white text-sm px-4 py-3 w-full outline-none focus:border-gold/40 placeholder:text-arena-400"
            disabled={creating}
          />
        )}
      </Section>

      <Section label={t('arena.create.categories')} id="categories-label">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="categories-label"
        >
          {roomCategories.map((category) => {
            const selected = categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setCategories((current) =>
                    current.includes(category)
                      ? current.filter((c) => c !== category)
                      : [...current, category]
                  )
                }
                aria-pressed={selected}
                disabled={creating}
                className={`cursor-pointer border px-4 py-2 text-[11px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  selected
                    ? 'border-gold bg-gold font-bold text-arena-950'
                    : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        {categories.length === 0 && (
          <p
            className="mt-3 text-[11px] tracking-wider text-gold"
            aria-live="polite"
          >
            {t('arena.create.needCategory')}
          </p>
        )}
      </Section>

      <Section label={t('arena.create.maxPlayers')} id="capacity-label">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="capacity-label"
        >
          {CAPACITIES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxPlayers(n)}
              aria-pressed={maxPlayers === n}
              disabled={creating}
              className={`w-12 cursor-pointer border py-2 text-sm font-bold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                maxPlayers === n
                  ? 'border-gold bg-gold text-arena-950'
                  : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 text-[10px] tracking-wider text-arena-300">
          {t('arena.create.maxPlayersHint')}
        </div>
      </Section>

      {/* What the server fixes */}
      <Section
        label={t('arena.create.rules')}
        sublabel={t('arena.create.rulesDesc')}
      >
        <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
          <Recap label={t('arena.common.startingMoney')} value={money(500)} />
          <Recap
            label={t('arena.create.seats')}
            value={t('arena.create.seatsValue', { n: maxPlayers })}
          />
          <Recap
            label={t('arena.common.difficulty')}
            value={t('arena.create.difficultyValue')}
          />
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
          {creating ? t('arena.create.creating') : t('arena.create.submit')}
        </button>
        <Link
          href="/home"
          className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-arena-700 transition-colors"
        >
          {t('arena.common.cancel')}
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
