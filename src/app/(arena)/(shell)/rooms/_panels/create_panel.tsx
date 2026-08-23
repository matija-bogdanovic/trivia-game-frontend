'use client';

import Link from 'next/link';
import { money } from '@/app/(arena)/_lib/money';
import { useT } from '@/app/lib/i18n';
import {
  QUESTION_CATEGORIES,
  categoriesToSend,
} from '@/app/(arena)/_lib/categories';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/app/helpers/api';
import { getUsername } from '@/app/helpers/token_operations';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import ToggleSwitch from '@/app/(arena)/_components/toggle_switch';

amplifyConfigure();

/**
 * The arena Create Room design, driving the real POST /createRoom.
 *
 * Difficulty is still read-only below: it really is a constant in the game
 * server, so it is shown as a rule the room runs under rather than as a
 * control that quietly does nothing. Capacity and starting coins are no longer
 * among them — createRoom persists both, so they are real choices.
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

/**
 * What every player is seeded with. The server clamps to this same range, so
 * the slider cannot offer a number the room would not actually get; the step
 * keeps the value to round figures rather than an arbitrary $1,347.
 */
const MONEY_MIN = 500;
const MONEY_MAX = 2500;
const MONEY_STEP = 100;
const DEFAULT_MONEY = 500;

const clampMoney = (n: number) =>
  Math.min(
    MONEY_MAX,
    Math.max(MONEY_MIN, Math.round(n / MONEY_STEP) * MONEY_STEP)
  );

interface Created {
  lobbyId: string;
  roomCode: number;
}

export default function CreatePanel() {
  const { t } = useT();
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');
  /** the question pool the room draws from; at least one is required */
  /*
   * Every category selected by default — the room a host creates without
   * touching this draws from the whole bank, which is what they expect if
   * they never open the section. It is sent as [] (see categoriesToSend).
   */
  const [categories, setCategories] = useState<string[]>(() =>
    QUESTION_CATEGORIES.map((c) => c.id)
  );
  /*
   * On by default, matching the server. Someone who never opens this section
   * gets the behaviour the game already had; turning it off is a deliberate
   * "this table is closed".
   */
  const [spectateEnabled, setSpectateEnabled] = useState(true);
  /**
   * Is every category in play?
   *
   * True for BOTH "all 24 ticked" and "none ticked" — the server reads an
   * empty list as every category, so the two are the same room. The All chip
   * is pressed for either, because a control that looked off while the room
   * was in fact drawing from everything would be telling the host something
   * untrue.
   */
  const everyCategory =
    categories.length === 0 || categories.length === QUESTION_CATEGORIES.length;
  const [maxPlayers, setMaxPlayers] = useState<number>(DEFAULT_CAPACITY);
  const [startingMoney, setStartingMoney] = useState<number>(DEFAULT_MONEY);
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
          categories: categoriesToSend(categories),
          spectateEnabled,
          maxPlayers,
          // clamped again on the way out: the slider is bounded, but a stale
          // value from a restored form should not reach the server unchecked
          startingMoney: clampMoney(startingMoney),
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
          <Recap
            label={t('arena.common.startingMoney')}
            value={money(startingMoney)}
          />
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
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
        <div className="mb-3 flex items-center">
          <span
            className="ml-auto text-[10px] tracking-wider text-arena-300 uppercase"
            aria-live="polite"
          >
            {everyCategory
              ? t('arena.create.allCategories')
              : t('arena.create.categoriesChosen', { n: categories.length })}
          </span>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="categories-label"
        >
          {/*
            "Sve" sits with the categories rather than above them, because it
            is the same kind of choice — which questions this room draws — and
            a player scanning the row should meet it before the 24.

            It is PRESSED whenever every category is in play, and that is true
            for two different selections: all 24 ticked, and none ticked. The
            server reads an empty list as "every category", so both really are
            the same room — reflecting one state for both is what stops the
            control lying about what will happen.

            Pressing it clears the individual ticks rather than setting all 24.
            Same room either way, and it is the selection that keeps working if
            the question bank ever gains a category.
          */}
          <button
            type="button"
            onClick={() => setCategories([])}
            aria-pressed={everyCategory}
            disabled={creating}
            className={`cursor-pointer border px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
              everyCategory
                ? 'border-gold bg-gold text-arena-950'
                : 'border-gold/40 text-gold hover:bg-gold/10'
            }`}
          >
            {t('arena.create.allCategoriesToggle')}
          </button>

          {QUESTION_CATEGORIES.map((category) => {
            const selected = categories.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setCategories((current) =>
                    current.includes(category.id)
                      ? current.filter((c) => c !== category.id)
                      : [...current, category.id]
                  )
                }
                aria-pressed={selected}
                disabled={creating}
                className={`cursor-pointer border px-3 py-2 text-[11px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  selected
                    ? 'border-gold bg-gold font-bold text-arena-950'
                    : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
                }`}
              >
                {t(category.labelKey)}
              </button>
            );
          })}
        </div>
        {/*
          Not an error — clearing is how you say "any question", and the All
          chip above is lit to say so. This just spells it out the first time
          somebody lands here having cleared everything.
        */}
        {categories.length === 0 && (
          <p className="mt-3 text-[11px] text-arena-300" aria-live="polite">
            {t('arena.create.noneMeansAll')}
          </p>
        )}
      </Section>

      <Section label={t('arena.create.spectating')} id="spectate-label">
        {/*
          The same switch the settings screen uses, so a preference looks like
          a preference wherever it appears. Gating lives on the server — a
          room with this off refuses a mid-match joiner outright rather than
          seating them silently — so this checkbox is the whole feature, not a
          hint the engine may ignore.
        */}
        <ToggleSwitch
          label={t('arena.create.spectatingLabel')}
          description={t('arena.create.spectatingDesc')}
          labelId="spectate-label"
          checked={spectateEnabled}
          onToggle={() => setSpectateEnabled((v) => !v)}
        />
      </Section>

      <Section label={t('arena.create.startingMoney')} htmlFor="starting-money">
        <div className="mb-4 text-center">
          <div className="text-3xl font-bold text-gold tabular-nums sm:text-4xl">
            {money(startingMoney)}
          </div>
          <div className="mt-1 text-[10px] tracking-wider text-arena-300 uppercase">
            {t('arena.create.startingMoneyEach')}
          </div>
        </div>
        <input
          id="starting-money"
          type="range"
          min={MONEY_MIN}
          max={MONEY_MAX}
          step={MONEY_STEP}
          value={startingMoney}
          disabled={creating}
          onChange={(e) => setStartingMoney(clampMoney(Number(e.target.value)))}
          aria-valuetext={money(startingMoney)}
          className="w-full cursor-pointer accent-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        />
        <div className="mt-1 flex justify-between text-[10px] text-arena-300 tabular-nums">
          <span>{money(MONEY_MIN)}</span>
          <span>{money(MONEY_MAX)}</span>
        </div>
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
          <Recap
            label={t('arena.common.startingMoney')}
            value={money(startingMoney)}
          />
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
