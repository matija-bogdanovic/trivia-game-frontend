'use client';

import { useState } from 'react';
import { useT } from '@/app/lib/i18n';

/**
 * The one way a stake is entered, wherever a stake is entered.
 *
 * ── WHY THIS IS ONE COMPONENT ──────────────────────────────────────────────
 * The betting panel and the picking screen each had their own copy of this
 * control, and each copy had the same bug:
 *
 *     onChange={(e) => setAmount(Number(e.target.value) || MIN)}
 *
 * Clear the field to type a fresh figure and `Number("")` is 0, which is
 * falsy, which snaps the value straight back to the minimum — so an exact
 * sum could never be typed. The betting panel was fixed; the picking screen
 * was not, because nobody remembered there was a second one. That is the
 * whole argument for a shared component: a fix that has to be applied twice
 * will be applied once.
 *
 * ── WHAT IT DOES INSTEAD ───────────────────────────────────────────────────
 * The figure is held as TEXT while it is being typed and coerced only when
 * it is used. Empty is a legal intermediate state, not a legal bet.
 *
 * `inputMode="numeric"` is what summons the digits-only keypad on a phone;
 * `type="number"` is what made the field impossible to clear in the first
 * place, and its native spinners do not render on a phone anyway. So the
 * nudges are real buttons — fixed steps of ten and a hundred, because a
 * step that scales with the stack moves a different amount every round and
 * can never be pressed without reading it first.
 *
 * The parent owns nothing but the clamped result. It receives `stake`
 * through onChange every time the figure settles and never sees the draft.
 */
export default function StakeControl({
  min,
  max,
  value,
  onChange,
  id = 'stake',
  compact = false,
}: {
  /** the server's floor; below it a stake is refused outright */
  min: number;
  /** what the player actually holds */
  max: number;
  /** the current clamped stake */
  value: number;
  onChange: (stake: number) => void;
  id?: string;
  /** tighter spacing for a panel that shares the screen with a question */
  compact?: boolean;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState(String(value));

  const clamp = (n: number) =>
    Math.min(Math.max(min, max), Math.max(min, Number.isFinite(n) ? n : min));

  const settle = (text: string) => {
    const stake = clamp(Number(text.replace(/[^0-9]/g, '')));
    setDraft(String(stake));
    onChange(stake);
    return stake;
  };

  const nudge = (by: number) => settle(String(value + by));
  const cannot = max < min;

  return (
    <div className={compact ? 'mb-3' : 'mb-4'}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        enterKeyHint="done"
        value={draft}
        disabled={cannot}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        // clamped when the field is left, not while it is being typed
        onBlur={(e) => settle(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={t('arena.bet.stake')}
        className="mb-2 h-12 w-full min-w-0 rounded-lg border border-white/10 bg-arena-750 px-3 text-center text-lg font-bold text-white tabular-nums outline-none focus:border-gold/40 disabled:text-arena-500"
      />

      {/* ±10 and ±100, each 44px, greyed rather than hidden when they would do nothing */}
      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {([-100, -10, 10, 100] as const).map((by) => {
          const next = value + by;
          const possible = !cannot && next >= min && next <= max;
          return (
            <button
              key={by}
              type="button"
              onClick={() => nudge(by)}
              disabled={!possible}
              className="h-11 cursor-pointer rounded-lg border border-white/10 bg-arena-750 text-[13px] font-bold text-white tabular-nums transition-colors hover:border-gold/40 disabled:cursor-not-allowed disabled:border-arena-600 disabled:text-arena-500"
            >
              {by > 0 ? `+${by}` : by}
            </button>
          );
        })}
      </div>

      {/* fractions of what you hold, which is how people actually bet */}
      <div className="grid grid-cols-3 gap-1.5">
        {(
          [
            ['¼', Math.floor(max / 4)],
            ['½', Math.floor(max / 2)],
            [t('arena.bet.allIn'), max],
          ] as const
        ).map(([label, target]) => (
          <button
            key={label}
            type="button"
            onClick={() => settle(String(target))}
            disabled={cannot}
            className="h-9 cursor-pointer rounded-lg border border-gold/30 text-[11px] font-bold tracking-wider text-gold uppercase transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-arena-500 disabled:text-arena-500"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
