'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useCountdown } from '@/app/components/hooks/game/use_server_clock';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';
import { FlameIcon, SwordIcon } from '@/app/(arena)/_components/icons';

/**
 * Choosing who answers next, and how.
 *
 * Two decisions in one screen, because the server takes them as one message:
 * a target, and either a CHALLENGE (they answer a harder question alone, and
 * the picker may back the outcome with their own money) or a DUEL (both race
 * the same question, both ante).
 *
 * Every price here is the server's. pick_start carries a `targets` array with
 * per-target quotas — a challenge is priced off the TARGET's accuracy, not the
 * picker's — and the exact ante a duel with that person would cost. Nothing is
 * computed locally, because none of it can be: accuracy lives server-side.
 *
 * The wager is committed blind. The question is drawn in the same mutation
 * that takes the stake, so nobody has seen it — picker included. The screen
 * says so rather than implying a read on the question.
 */
export default function ArenaPicking() {
  const { t } = useT();
  const { pickPlayer, username } = useGame();
  const {
    players,
    picker,
    pickChoices,
    currentPick,
    pickEndsAt,
    pickDurationMs,
    minBet,
  } = useSelector((s: RootState) => s.game);

  const [target, setTarget] = useState<string | null>(null);
  const [side, setSide] = useState<'correct' | 'wrong' | null>(null);
  const [amount, setAmount] = useState(minBet);
  const { seconds } = useCountdown(pickEndsAt, pickDurationMs);

  const iAmPicker = Boolean(username) && picker === username;
  const choices = pickChoices ?? [];
  const priced = currentPick?.targets ?? [];
  const me = players.find((p) => p.username === username);
  const myMoney = me?.money ?? 0;

  const priceFor = (u: string) => priced.find((x) => x.username === u);
  const chosen = target ? priceFor(target) : undefined;
  const pickerName = displayNameOf(players, picker);

  if (!iAmPicker) {
    return (
      <div className="w-full max-w-lg text-center">
        <div className="mb-3 text-[11px] tracking-[0.3em] text-arena-200 uppercase">
          {t('arena.pick.waiting')}
        </div>
        <div className="mb-6 text-2xl font-bold tracking-wide text-white">
          {t('arena.pick.chooses', { name: pickerName })}
        </div>
        <div className="text-4xl font-bold text-gold tabular-nums" role="timer">
          {seconds}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mb-2 text-[10px] tracking-[0.3em] text-arena-200 uppercase">
          {t('arena.pick.yourChoice')}
        </div>
        <h1 className="text-2xl font-bold tracking-wide text-white">
          {t('arena.pick.title')}
        </h1>
        <div
          className="mt-2 text-2xl font-bold text-gold tabular-nums"
          role="timer"
        >
          {seconds}
        </div>
      </div>

      {/* ========================================================== targets */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {choices.map((u) => {
          const p = players.find((x) => x.username === u);
          const price = priceFor(u);
          const selected = target === u;
          return (
            <button
              key={u}
              type="button"
              onClick={() => setTarget(u)}
              aria-pressed={selected}
              className={`cursor-pointer border p-5 text-center transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                selected
                  ? 'border-gold/60 bg-gold/10'
                  : 'border-white/[0.07] bg-arena-800 hover:border-gold/30 hover:bg-arena-750'
              }`}
            >
              <div className="mb-3 flex justify-center">
                <Avatar
                  name={p?.displayName ?? u}
                  username={u}
                  avatar={p?.avatar}
                  accent={selected}
                  size="lg"
                />
              </div>
              <div className="mb-1 font-bold text-white">
                {p?.displayName ?? u}
              </div>
              {(p?.streak ?? 0) > 0 && (
                <div className="mb-1 flex items-center justify-center gap-1 text-sm text-flame">
                  <FlameIcon className="h-3.5 w-3.5 shrink-0" />
                  {p?.streak}
                </div>
              )}
              <div className="text-[11px] text-arena-200 tabular-nums">
                {money(p?.money ?? 0)}
              </div>
              {/* the server's price on this person, both ways */}
              {price && (
                <div className="mt-2 border-t border-white/[0.07] pt-2 text-[10px] text-arena-300">
                  <div className="tabular-nums">
                    {t('arena.pick.odds', {
                      correct: price.quotas?.correct?.toFixed(2) ?? '—',
                      wrong: price.quotas?.wrong?.toFixed(2) ?? '—',
                    })}
                  </div>
                  <div className="tabular-nums">
                    {t('arena.pick.ante', { amount: money(price.duelAnte) })}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {choices.length === 0 && (
        <p className="mb-6 text-center text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.pick.noTargets')}
        </p>
      )}

      {/* ===================================================== the optional wager */}
      {target && (
        <div className="mb-6 border border-white/[0.07] bg-arena-800 p-5">
          <div className="mb-3 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.pick.backIt')}
          </div>
          <p className="mb-4 text-[11px] text-arena-300">
            {t('arena.pick.blind')}
          </p>
          <div className="mb-4 flex flex-wrap gap-3">
            {(['correct', 'wrong'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(side === s ? null : s)}
                aria-pressed={side === s}
                className={`flex-1 border py-3 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  side === s
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'cursor-pointer border-white/10 text-white hover:bg-arena-700'
                }`}
              >
                {s === 'correct' ? t('arena.bet.right') : t('arena.bet.wrong')}
                {chosen?.quotas && (
                  <span className="ml-2 tabular-nums opacity-80">
                    {chosen.quotas[s].toFixed(2)}×
                  </span>
                )}
              </button>
            ))}
          </div>
          {side && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={minBet}
                max={Math.max(minBet, myMoney)}
                step={10}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || minBet)}
                aria-label={t('arena.bet.stake')}
                className="w-full border border-white/10 bg-arena-750 px-3 py-2 text-sm text-white tabular-nums outline-none focus:border-gold/40"
              />
              <span className="shrink-0 text-[10px] tracking-wider text-arena-300 uppercase">
                {t('arena.pick.ofYours', { amount: money(myMoney) })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ modes */}
      <div className="mb-4 text-center text-[11px] tracking-wider text-arena-200 uppercase">
        {t('arena.pick.howTitle')}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          disabled={!target}
          onClick={() =>
            target &&
            pickPlayer(
              target,
              'challenge',
              side
                ? { side, amount: Math.min(myMoney, Math.max(minBet, amount)) }
                : undefined
            )
          }
          className={`border py-5 font-bold tracking-widest uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
            target
              ? 'cursor-pointer border-white/20 text-white hover:bg-arena-700'
              : 'cursor-not-allowed border-arena-500 text-arena-500'
          }`}
        >
          {t('arena.pick.challenge')}
        </button>
        <button
          type="button"
          disabled={!target}
          onClick={() => target && pickPlayer(target, 'duel')}
          className={`py-5 text-lg font-bold tracking-widest uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
            target
              ? 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
              : 'cursor-not-allowed bg-arena-700 text-arena-400'
          }`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <SwordIcon className="h-5 w-5 shrink-0" />
            {t('arena.pick.duel')}
          </span>
          {chosen && (
            <span className="mt-1 block text-[10px] font-normal tracking-normal normal-case opacity-80">
              {t('arena.pick.ante', { amount: money(chosen.duelAnte) })}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
