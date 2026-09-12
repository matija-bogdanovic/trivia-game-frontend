'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import { money } from '@/app/(arena)/_lib/money';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useCountdown } from '@/app/components/hooks/game/use_server_clock';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';
import StakeControl from './stake_control';

/** the server's floor; a stake below it is rejected outright */
const MIN_BET = 10;

/**
 * The book, in the design's bet-panel shape.
 *
 * It is an aside rather than a stage because betting runs ACROSS two phases —
 * open from the moment the question appears until the pause closes — so it has
 * to sit beside the question rather than replace it.
 *
 * Payouts are guaranteed now: a winning stake returns amount x quota, never
 * scaled down, so the panel can state the figure before the bet is placed
 * rather than hedging it. The quota is locked at placement, which is also why
 * there is no raise — one declaration per player per turn.
 *
 * Abstaining is a real declaration, not a way of not answering: the pause ends
 * as soon as everyone has declared, so neutral is what shortens it.
 */
export default function ArenaBetting() {
  const { t } = useT();
  const { placeBet, username } = useGame();
  const {
    players,
    answering,
    quotas,
    pot,
    myBet,
    betCount,
    betEndsAt,
    betDurationMs,
    answerEndsAt,
    answerDurationMs,
    betDenied,
    phase,
  } = useSelector((s: RootState) => s.game);

  /*
    The figure the side buttons send. HOW it is entered — typing, the ±10 and
    ±100 nudges, the fractions — lives in StakeControl, shared with the
    picking screen. The two used to carry separate copies of the same input
    with the same bug, and when one was fixed the other was not.
  */
  const [stake, setStake] = useState(50);

  /*
    THE CLOCK THIS PANEL SHOWS.

    It used to show one only during the `betting` pause, and nothing at all
    while the question was up — which is most of the window. So the panel sat
    there looking untimed, and the first number a bettor ever saw was the one
    that appeared when the pause started and the answerer had already buzzed.
    Matija's report was the clock running out mid-typing, and this is why:
    there was no clock to watch until it was nearly gone.

    Whichever phase is live owns the readout. During the question that is the
    question's own deadline — not a betting deadline, but the honest answer to
    "how long have I got", since the answerer can end it at any moment.
  */
  const inPause = phase === 'betting';
  const { seconds } = useCountdown(
    inPause ? betEndsAt : answerEndsAt,
    inPause ? betDurationMs : answerDurationMs
  );
  const deadline = inPause ? betEndsAt : answerEndsAt;
  const urgent = deadline !== null && seconds <= 3;

  /*
    A refusal, worded. The server names each one distinctly so this can say
    what happened rather than "failed" — and the one people will actually
    meet is `too-late`, because the clock on this panel is the client's and
    the server's is the one that decides.
  */
  const deniedNotice = (() => {
    switch (betDenied) {
      case null:
      case undefined:
        return null;
      case 'too-late':
        return t('arena.bet.denied.tooLate');
      case 'too-poor':
        return t('arena.bet.denied.tooPoor', { min: money(MIN_BET) });
      case 'already':
        return t('arena.bet.denied.already');
      case 'eliminated':
        return t('arena.bet.denied.eliminated');
      case 'self':
        return t('arena.bet.denied.self');
      case 'not-open':
      case 'challenge':
        return t('arena.bet.denied.closed');
      default:
        return t('arena.bet.denied.generic');
    }
  })();

  const me = (players ?? []).find((p) => p.username === username);
  const myMoney = me?.money ?? 0;
  const declared = myBet !== null;

  const payoutFor = (side: 'correct' | 'wrong') =>
    quotas
      ? Math.round(Math.min(myMoney, Math.max(MIN_BET, stake)) * quotas[side])
      : null;

  const answererName = displayNameOf(players, answering);

  return (
    /*
      A BOTTOM SHEET ON A PHONE, a column on a desktop.

      It used to be an aside that simply stacked under the stage, which on a
      375px screen put it below the fold — so the betting window, which is
      often ten seconds and sometimes all of it, opened somewhere the player
      could not see without scrolling for it.

      Fixed to the bottom it is always in reach, capped at 55vh so the
      question it is a bet ON stays visible above it, and it scrolls
      internally when the content is taller. From lg up none of that applies
      and it goes back to being the right-hand column.
    */
    <aside className="fixed inset-x-0 bottom-0 z-30 flex max-h-[55dvh] shrink-0 flex-col overflow-y-auto border-t border-white/[0.07] bg-arena-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.7)] lg:static lg:max-h-none lg:w-64 lg:overflow-visible lg:border-t-0 lg:border-l lg:p-5 lg:pb-5 lg:shadow-none">
      <div className="mb-1 flex items-baseline justify-between">
        <div className="text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          {t('arena.bet.title')}
        </div>
        {deadline !== null && (
          <span
            className={`text-sm font-bold tabular-nums ${
              urgent ? 'animate-pulse text-blood' : 'text-gold'
            }`}
            role="timer"
          >
            {seconds}
          </span>
        )}
      </div>

      <p className="mb-4 text-[11px] text-arena-200">
        {t('arena.bet.question', { name: answererName })}
      </p>

      {/*
        Why the last stake did not stand. Every one of these used to be
        silent, and the panel went on showing a bet the server had refused.
        Missing the deadline is the common one — the clock here is the
        client's, and the server's is the one that decides.
      */}
      {deniedNotice && (
        <p
          className="mb-4 rounded-lg border border-blood/40 bg-blood/[0.08] p-3 text-[11px] leading-relaxed text-white"
          role="status"
          aria-live="polite"
        >
          {deniedNotice}
        </p>
      )}

      {/*
        The pot and your own money, side by side on a phone and stacked on a
        desktop. They are the two numbers a stake is decided against, so on a
        small screen they belong on one line rather than costing two.
      */}
      <div className="mb-3 grid grid-cols-2 gap-2 lg:mb-4 lg:grid-cols-1">
        <div className="rounded-lg border border-white/[0.07] bg-arena-750 p-2.5 text-center">
          <div className="text-[10px] tracking-wider text-arena-300 uppercase">
            {t('arena.game.pot')}
          </div>
          <div className="text-base font-bold text-gold tabular-nums lg:text-lg">
            {money(pot)}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-arena-750 p-2.5 text-center lg:hidden">
          <div className="text-[10px] tracking-wider text-arena-300 uppercase">
            {t('arena.bet.yourMoney')}
          </div>
          <div className="text-base font-bold text-gold tabular-nums">
            {money(myMoney)}
          </div>
        </div>
      </div>

      {!declared && (
        <>
          {/* stake: a figure, or everything */}
          <label
            className="mb-1 block text-[10px] tracking-wider text-arena-300 uppercase"
            htmlFor="bet-amount"
          >
            {t('arena.bet.stake')}
          </label>
          {/*
            Minus, the figure, plus — and every one of them at least 44px,
            which is the smallest thing a thumb hits reliably. The native
            number spinners this replaced are invisible on a phone, which is
            where most of this game is played.
          */}
          <StakeControl
            id="bet-amount"
            min={MIN_BET}
            max={myMoney}
            value={Math.min(myMoney, Math.max(MIN_BET, stake))}
            onChange={setStake}
            compact
          />

          {/* two across on a phone so both are inside thumb reach at once */}
          <div className="mb-3 grid grid-cols-2 gap-2 lg:mb-6 lg:grid-cols-1 lg:gap-3">
            {(['correct', 'wrong'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => {
                  const wager = Math.min(myMoney, Math.max(MIN_BET, stake));
                  placeBet(side, wager, wager >= myMoney);
                }}
                disabled={myMoney < MIN_BET}
                className={`w-full rounded-lg border py-3.5 text-[12px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  myMoney < MIN_BET
                    ? 'cursor-not-allowed border-arena-500 text-arena-500'
                    : side === 'correct'
                      ? 'cursor-pointer border-gold/40 text-gold hover:bg-gold/10'
                      : 'cursor-pointer border-white/20 text-white hover:bg-arena-700'
                }`}
              >
                <span className="block">
                  {side === 'correct'
                    ? t('arena.bet.right')
                    : t('arena.bet.wrong')}
                  {quotas && (
                    <span className="ml-2 tabular-nums opacity-80">
                      {quotas[side].toFixed(2)}×
                    </span>
                  )}
                </span>
                {/* guaranteed, not an estimate — payouts are never scaled */}
                {payoutFor(side) !== null && (
                  <span className="mt-1 block text-[10px] font-normal tracking-normal normal-case opacity-70">
                    {t('arena.bet.pays', { amount: money(payoutFor(side)!) })}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => placeBet('neutral', 0)}
            className="mb-4 w-full cursor-pointer rounded-lg border border-white/10 py-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.bet.sitOut')}
          </button>

          {myMoney < MIN_BET && (
            <p className="mb-4 text-[10px] tracking-wider text-arena-300 uppercase">
              {t('arena.bet.tooPoor', { min: money(MIN_BET) })}
            </p>
          )}
        </>
      )}

      {declared && (
        <div className="mb-4 rounded-lg border border-white/[0.07] bg-arena-750 p-3 text-center">
          <div className="mb-1 text-[10px] tracking-wider text-arena-300 uppercase">
            {t('arena.bet.yours')}
          </div>
          <div className="font-bold text-white">
            {myBet?.kind === 'neutral'
              ? t('arena.bet.satOut')
              : t('arena.bet.placed', {
                  amount: money(myBet?.amount ?? 0),
                  side:
                    myBet?.bet === 'correct'
                      ? t('arena.bet.right')
                      : t('arena.bet.wrong'),
                })}
          </div>
        </div>
      )}

      {betCount > 0 && (
        <div className="text-[10px] tracking-wider text-arena-300 uppercase">
          {t('arena.bet.declared', { n: betCount })}
        </div>
      )}

      <div className="mt-auto hidden border-t border-white/[0.07] pt-4 lg:block">
        <div className="mb-1 text-[10px] tracking-wider text-arena-300 uppercase">
          {t('arena.bet.yourMoney')}
        </div>
        <div className="text-lg font-bold text-gold tabular-nums">
          {money(myMoney)}
        </div>
      </div>
    </aside>
  );
}
