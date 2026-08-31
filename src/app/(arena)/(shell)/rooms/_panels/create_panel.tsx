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
import { usePasswordReveal } from '@/app/(arena)/_components/password_reveal';
import {
  CoinsIcon,
  GlobeIcon,
  LockIcon,
  TrendUpIcon,
  UsersIcon,
} from '@/app/(arena)/_components/icons';

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

/**
 * The two room types, and the colour each one is told apart by.
 *
 * Frost for public and gold for private is not decoration — it is the same
 * pairing the browse list uses on every room card, so a host picking a type
 * here sees the badge their room will wear there. Opposite temperatures do the
 * work: open to anyone, or shut behind a password.
 *
 * The tint is on the ICON, never the label — the label already carries the
 * card's selected state in gold, and a heading that changed colour for two
 * different reasons at once would say neither clearly.
 */
const VISIBILITY = {
  public: { Icon: GlobeIcon, tint: 'text-frost' },
  private: { Icon: LockIcon, tint: 'text-gold' },
} as const;

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
   * empty list as every category, so the two are the same room.
   *
   * Everything downstream reads this one flag: the All chip is pressed, the
   * count line says "all categories", and EVERY category chip is lit. That
   * last one is the point — a control that looked off while the room was in
   * fact drawing from everything was telling the host something untrue, and
   * the 24 chips were doing exactly that while the All chip alone was gold.
   */
  const everyCategory =
    categories.length === 0 || categories.length === QUESTION_CATEGORIES.length;
  const [maxPlayers, setMaxPlayers] = useState<number>(DEFAULT_CAPACITY);
  const [startingMoney, setStartingMoney] = useState<number>(DEFAULT_MONEY);
  const [credits, setCredits] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const roomPassword = usePasswordReveal('room-password');

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

      /*
       * Straight into the room, no interstitial.
       *
       * There used to be a confirmation screen here whose job was to show the
       * host the room code so they could send it to somebody. The lobby shows
       * that code at 3xl with click-to-copy, so the screen was a stop between
       * making a room and being in it that carried nothing the destination did
       * not already carry.
       *
       * `creating` stays TRUE through the push. The route change is not
       * instant, and re-enabling the button for those few hundred milliseconds
       * invites a second click that would spend another lobby credit on a
       * second room.
       */
      router.push(`/game/${String(data.lobbyId)}`);
    } catch {
      setError(t('arena.create.unreachable'));
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Room Name */}
      <Section label={t('arena.create.roomName')} htmlFor="room-name">
        <input
          id="room-name"
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value.toUpperCase())}
          className="bg-arena-750 rounded-sm border border-white/10 text-white text-xl font-bold tracking-widest px-5 py-4 w-full outline-none focus:border-gold/40 placeholder:text-arena-400 uppercase"
          placeholder={t('arena.create.namePlaceholder')}
          maxLength={NAME_MAX}
          disabled={creating}
        />
        {/*
          The rule on the left, the count on the right.

          maxLength already stopped the 14th character from being typed, but
          silently — a key press that does nothing and says nothing reads as a
          broken keyboard. The counter turns the same limit into something the
          reader can see coming.

          It goes gold at the ceiling rather than red: hitting the limit is not
          an error, it is the field being full, and this app spends red on
          nothing at all outside an achievement badge.

          aria-live is deliberately ABSENT. The count changes on every
          keystroke, and a screen reader reciting "6 of 13, 7 of 13" over the
          characters being typed is worse than not knowing — the rule beside it
          is static, and that is the part worth hearing.
        */}
        <div className="mt-2 flex items-baseline justify-between gap-3 text-[10px] tracking-wider text-arena-300">
          <span>
            {t('arena.create.nameHint', { min: NAME_MIN, max: NAME_MAX })}
          </span>
          <span
            className={`shrink-0 tabular-nums ${
              roomName.length >= NAME_MAX ? 'text-gold' : ''
            }`}
          >
            {t('arena.create.nameCount', {
              n: roomName.length,
              max: NAME_MAX,
            })}
          </span>
        </div>
      </Section>

      {/* Visibility */}
      <Section label={t('arena.create.visibility')} id="visibility-label">
        <div
          className="grid gap-4 sm:grid-cols-2"
          role="group"
          aria-labelledby="visibility-label"
        >
          {(['public', 'private'] as const).map((v) => {
            const { Icon, tint } = VISIBILITY[v];
            return (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                disabled={creating}
                aria-pressed={visibility === v}
                className={`p-5 rounded-sm border text-left transition-colors ${
                  visibility === v
                    ? 'border-gold/40 bg-gold/10'
                    : 'border-white/10 bg-arena-750 hover:bg-arena-700'
                } focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none`}
              >
                <div
                  className={`mb-1 flex items-center gap-2 text-sm font-bold tracking-widest ${visibility === v ? 'text-gold' : 'text-white'}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${tint}`} />
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
            );
          })}
        </div>
        {visibility === 'private' && (
          <div className="relative mt-4">
            <input
              id="room-password"
              type={roomPassword.type}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('arena.create.passwordPlaceholder')}
              aria-label={t('arena.create.passwordPlaceholder')}
              className="w-full rounded-sm border border-white/10 bg-arena-750 py-3 pr-11 pl-4 text-sm text-white outline-none placeholder:text-arena-400 focus:border-gold/40"
              disabled={creating}
            />
            {!creating && roomPassword.button}
          </div>
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
            the question bank ever gains a category — the chips are lit from
            everyCategory, not from list membership, so clearing still shows
            all 24 as on.
          */}
          <button
            type="button"
            onClick={() => setCategories([])}
            aria-pressed={everyCategory}
            disabled={creating}
            className={`cursor-pointer rounded-sm border px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
              everyCategory
                ? 'border-gold bg-gold text-arena-950'
                : 'border-gold/40 text-gold hover:bg-gold/10'
            }`}
          >
            {t('arena.create.allCategoriesToggle')}
          </button>

          {QUESTION_CATEGORIES.map((category) => {
            /*
              Lit whenever the room is drawing from everything, INCLUDING the
              empty selection. An empty list is the server's way of saying
              "every category", so a row of unlit chips was describing the
              opposite of the room being made — it read as "nothing is in
              play" when in fact all 24 were.
            */
            const selected = everyCategory || categories.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setCategories((current) =>
                    /*
                      Clicking a lit chip in the all-state means "all but this
                      one". The chips are showing every category as included,
                      so removing the one pressed is the only reading a click
                      can have — where the old code, seeing an empty list,
                      would have ADDED it and narrowed the room to that single
                      category.
                    */
                    current.length === 0
                      ? QUESTION_CATEGORIES.filter(
                          (c) => c.id !== category.id
                        ).map((c) => c.id)
                      : current.includes(category.id)
                        ? current.filter((c) => c !== category.id)
                        : [...current, category.id]
                  )
                }
                aria-pressed={selected}
                disabled={creating}
                className={`cursor-pointer rounded-sm border px-3 py-2 text-[11px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
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
          The "nothing selected means every category" note that used to sit
          here is gone. It existed to talk a host out of what the picker was
          showing them — 24 dark chips under a lit All — and the chips now say
          it themselves. A sentence explaining the UI is a patch on the UI;
          once the display is honest, the patch is noise.
        */}
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
              className={`w-12 cursor-pointer rounded-sm border py-2 text-sm font-bold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
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
            Icon={CoinsIcon}
          />
          <Recap
            label={t('arena.create.seats')}
            value={t('arena.create.seatsValue', { n: maxPlayers })}
            Icon={UsersIcon}
          />
          {/* the difficulty is not a number but a slope — it climbs with the chain */}
          <Recap
            label={t('arena.common.difficulty')}
            value={t('arena.create.difficultyValue')}
            Icon={TrendUpIcon}
          />
        </div>
      </Section>

      {error && (
        <div className="bg-arena-800 rounded-sm border border-gold/40 text-arena-100 text-sm px-4 py-3">
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
          className="rounded-sm border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-arena-700 transition-colors"
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
    <section className="rounded-sm border border-white/[0.07] bg-arena-800 p-6">
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

/**
 * One figure in a recap grid, with the icon that says which figure it is.
 *
 * The icon sits with the LABEL, not the value, and in the label's muted
 * arena-300 rather than gold. These rows are a summary of settings already
 * chosen elsewhere on the form — an icon in the accent colour would pull the
 * eye to a read-only recap and away from the controls that still need a
 * decision. Muted, it does what it is for: telling the three columns apart at
 * a glance when they are stacked on a phone.
 *
 * `Icon` is optional because the recap on the created-room screen sits under
 * its own heading and does not need them.
 */
function Recap({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon?: (props: { className?: string }) => React.ReactElement;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-center gap-1.5 text-[10px] tracking-wider text-arena-300 uppercase">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}
