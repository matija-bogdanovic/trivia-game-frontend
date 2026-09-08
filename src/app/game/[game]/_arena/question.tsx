'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useCountdown } from '@/app/components/hooks/game/use_server_clock';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { money } from '@/app/(arena)/_lib/money';
import { useT } from '@/app/lib/i18n';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * The question, in the arena design.
 *
 * Two things this screen must not assume, both learned the hard way. It reads
 * `options` with a floor rather than trusting the message to carry one — a
 * turn_question whose question is missing sends `options: undefined` — and it
 * takes the answerer's name through displayNameOf rather than indexing the
 * roster, because the roster is a different message's business and may not have
 * arrived yet. Neither is defensive clutter: this is the screen where a
 * `.find()` on an absent array used to take the whole match down.
 *
 * The pick is local until it is locked in. The design asks for it and the
 * server agrees — submit_answer is final and there is no unsubmit — so the
 * confirm is the last point where a misclick is still recoverable.
 */
export default function ArenaQuestion() {
  const { t } = useT();
  const { submitAnswer, username } = useGame();
  const {
    questionText,
    options,
    answering,
    players,
    selectedAnswer,
    hasAnswered,
    answerEndsAt,
    answerDurationMs,
    difficulty,
    turnMode,
    challengeBet,
    quotas,
  } = useSelector((s: RootState) => s.game);

  const [pending, setPending] = useState<string | null>(null);
  const { seconds, percent } = useCountdown(answerEndsAt, answerDurationMs);

  // a new question clears the previous pick
  useEffect(() => {
    setPending(null);
  }, [questionText]);

  const choices = options ?? [];
  const iAmAnswering = Boolean(username) && answering === username;
  const submitted = selectedAnswer !== null || hasAnswered;
  const answererName = displayNameOf(players, answering);
  const urgent = seconds <= 5;

  return (
    <div className="w-full max-w-2xl">
      {/* ======================================================= who + clock */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 truncate text-[10px] tracking-[0.3em] text-gold uppercase">
            {t('arena.game.isAnswering', { name: answererName })}
          </div>
          <div className="text-[10px] tracking-widest text-arena-200 uppercase">
            {t('arena.game.difficulty', { n: difficulty })}
          </div>
        </div>
        <div
          className={`text-4xl font-bold tabular-nums transition-colors ${
            urgent ? 'animate-pulse text-gold' : 'text-white'
          }`}
          role="timer"
          aria-live="off"
        >
          {seconds < 10 ? `0${seconds}` : seconds}
        </div>
      </div>

      {/* the clock, read at a glance */}
      <div className="mb-4 h-0.5 w-full overflow-hidden bg-arena-700">
        <div
          className={`h-full transition-[width] duration-300 ease-linear ${urgent ? 'bg-gold' : 'bg-arena-300'}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/*
        A challenge is this same screen with a banner. The picker aimed the
        question and owns the book on it; which SIDE they took is deliberately
        not here, because the server withholds it until reveal.
      */}
      {turnMode === 'challenge' && (
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-[11px] tracking-wider text-gold">
          {challengeBet
            ? t('arena.game.challengeBanner', {
                name: displayNameOf(players, challengeBet.username),
                amount: money(challengeBet.amount),
              })
            : t('arena.game.challengeBannerPlain')}
        </div>
      )}

      {/* ========================================================= question */}
      <div className="mb-4 rounded-lg border border-white/[0.07] bg-arena-800 p-6 sm:p-8">
        <h1 className="mb-8 text-xl leading-relaxed font-bold text-white">
          {questionText || '…'}
        </h1>

        <div className="grid gap-3 sm:grid-cols-2">
          {choices.map((option, i) => {
            const picked = submitted
              ? option === selectedAnswer
              : option === pending;
            const interactive = iAmAnswering && !submitted;
            return (
              <button
                key={option}
                type="button"
                onClick={() => interactive && setPending(option)}
                disabled={!interactive}
                aria-pressed={picked}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  picked
                    ? 'border-gold bg-gold/15 text-gold'
                    : interactive
                      ? 'cursor-pointer border-white/10 text-white hover:border-gold/40 hover:bg-arena-700'
                      : 'cursor-default border-white/10 text-arena-200'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold ${
                    picked
                      ? 'bg-gold text-arena-950'
                      : 'bg-arena-700 text-arena-200'
                  }`}
                  aria-hidden="true"
                >
                  {LETTERS[i] ?? i + 1}
                </span>
                <span className="text-sm">{option}</span>
              </button>
            );
          })}
        </div>

        {choices.length === 0 && (
          <p className="text-[11px] tracking-wider text-arena-300 uppercase">
            {t('arena.game.noOptions')}
          </p>
        )}
      </div>

      {/* the odds on this answerer, while the question is open */}
      {quotas && (
        <div className="mb-4 flex flex-wrap justify-center gap-4 text-[10px] tracking-widest text-arena-300 uppercase">
          <span>
            {t('arena.game.quotaCorrect')}{' '}
            <span className="font-bold text-gold tabular-nums">
              {quotas.correct.toFixed(2)}
            </span>
          </span>
          <span>
            {t('arena.game.quotaWrong')}{' '}
            <span className="font-bold text-gold tabular-nums">
              {quotas.wrong.toFixed(2)}
            </span>
          </span>
        </div>
      )}

      {/* ============================================================ action */}
      {!iAmAnswering && (
        <div className="animate-pulse text-center text-[11px] tracking-wider text-arena-200">
          {t('arena.game.watching', { name: answererName })}
        </div>
      )}

      {iAmAnswering && submitted && (
        <div className="text-center text-[11px] tracking-wider text-arena-200 uppercase">
          {t('arena.game.answerLocked')}
        </div>
      )}

      {iAmAnswering && !submitted && pending !== null && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => submitAnswer(pending)}
            className="cursor-pointer bg-gold px-8 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.game.lockIn')}
          </button>
        </div>
      )}
    </div>
  );
}
