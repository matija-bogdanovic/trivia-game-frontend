'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useCountdown } from '@/app/components/hooks/game/use_server_clock';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';
import { FlameIcon, SwordIcon } from '@/app/(arena)/_components/icons';
import StakeControl from './stake_control';

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

  /*
   * HEADS-UP: THERE IS NOTHING TO CHOOSE, SO IT IS CHOSEN.
   *
   * With two players left the picker has exactly one possible target, and the
   * server knows it — afterReveal keeps the picking phase anyway, because the
   * decision that matters heads-up is not WHO but CHALLENGE-or-DUEL. The
   * screen did not follow: it still made you click the only person you could
   * click before the mode buttons would light up, against a 20-second clock.
   *
   * Keyed on the joined list rather than on length, so a new pick with a
   * different single target replaces the old one instead of keeping it.
   */
  const soleTarget = choices.length === 1 ? choices[0] : null;
  const choiceKey = choices.join('|');
  useEffect(() => {
    setSide(null);
    setAmount(minBet);
    setTarget(soleTarget);
    // minBet is the room's floor and does not change mid-match; re-running on
    // it would clear a wager the picker is in the middle of sizing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choiceKey, soleTarget]);

  if (!iAmPicker) {
    return (
      <div className="w-full max-w-lg text-center">
        <div className="mb-3 text-[11px] tracking-[0.3em] text-arena-200 uppercase">
          {t('arena.pick.waiting')}
        </div>
        <div className="mb-6 text-2xl font-bold tracking-wide text-white">
          {t('arena.pick.chooses', { name: pickerName })}
        </div>
        <div
          className="text-3xl font-bold text-gold tabular-nums sm:text-4xl"
          role="timer"
        >
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
          {soleTarget
            ? t('arena.pick.titleHeadsUp', {
                name: displayNameOf(players, soleTarget),
              })
            : t('arena.pick.title')}
        </h1>
        <div
          className="mt-2 text-2xl font-bold text-gold tabular-nums sm:text-3xl"
          role="timer"
        >
          {seconds}
        </div>
      </div>

      {/* ========================================================== targets */}
      <div
        className={`mb-8 grid gap-4 ${
          soleTarget
            ? 'mx-auto max-w-xs grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-3'
        }`}
      >
        {choices.map((u) => {
          const p = players.find((x) => x.username === u);
          const price = priceFor(u);
          const selected = target === u;
          return (
            <button
              key={u}
              type="button"
              // the only target is not a choice: it is already made, and a
              // control that cannot change anything should not invite a click
              onClick={() => !soleTarget && setTarget(u)}
              disabled={Boolean(soleTarget)}
              aria-pressed={selected}
              // min-w-0: a grid item sizes to its content too, so one long
              // name would widen its whole column and push the row sideways
              // a row on a phone — avatar beside the name rather than above
              // it — so a list of targets costs a third of the height it did
              className={`flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:flex-col sm:p-5 sm:text-center ${
                soleTarget
                  ? 'cursor-default border-gold/60 bg-gold/10'
                  : selected
                    ? 'cursor-pointer border-gold/60 bg-gold/10'
                    : 'cursor-pointer border-white/[0.07] bg-arena-800 hover:border-gold/30 hover:bg-arena-750'
              }`}
            >
              <div className="shrink-0 sm:mb-3 sm:flex sm:justify-center">
                <Avatar
                  name={p?.displayName ?? u}
                  username={u}
                  avatar={p?.avatar}
                  accent={selected}
                  size="lg"
                />
              </div>
              {/* one column beside the avatar; min-w-0 lets the name truncate */}
              <div className="min-w-0 flex-1 sm:w-full">
                <div
                  className="mb-1 truncate font-bold text-white"
                  title={p?.displayName ?? u}
                >
                  {p?.displayName ?? u}
                </div>
                {(p?.streak ?? 0) > 0 && (
                  <div className="mb-1 flex items-center gap-1 text-sm text-flame sm:justify-center">
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
              </div>
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
        <div className="mb-6 rounded-lg border border-white/[0.07] bg-arena-800 p-5">
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
                className={`flex-1 rounded-lg border py-3 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
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
            <>
              {/*
                The same control the betting panel uses. This used to be a
                second, hand-rolled number input with the same coercion bug
                the panel had — and when the panel was fixed, this was not,
                because nobody remembered it existed.
              */}
              <StakeControl
                id="pick-stake"
                min={minBet}
                max={myMoney}
                value={amount}
                onChange={setAmount}
                compact
              />
              <div className="text-[10px] tracking-wider text-arena-300 uppercase">
                {t('arena.pick.ofYours', { amount: money(myMoney) })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ modes */}
      {/*
        STICKY TO THE BOTTOM ON A PHONE.

        These two buttons are the decision, and they sat last in a column
        that — with two targets and a wager open — ran to twice the height
        of a phone screen. A picker under a twenty-five-second clock had to
        scroll to find the button that ends the phase, and the sole target
        being pre-selected made it worse: the screen looked ready, and the
        thing to press was off it.

        Pinned they are always in reach. From sm up the column fits and they
        go back to being the last thing in it.
      */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-2 border-t border-white/[0.07] bg-arena-900/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mb-3 text-center text-[11px] tracking-wider text-arena-200 uppercase sm:mb-4">
          {t('arena.pick.howTitle')}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <button
            type="button"
            disabled={!target}
            onClick={() =>
              target &&
              pickPlayer(
                target,
                'challenge',
                side
                  ? {
                      side,
                      amount: Math.min(myMoney, Math.max(minBet, amount)),
                    }
                  : undefined
              )
            }
            className={`min-h-[52px] rounded-lg border px-2 text-[12px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:text-sm sm:tracking-widest ${
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
            className={`min-h-[52px] rounded-lg px-2 text-[13px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:text-lg sm:tracking-widest ${
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
    </div>
  );
}
