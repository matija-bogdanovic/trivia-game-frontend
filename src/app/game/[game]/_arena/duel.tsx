'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useCountdown } from '@/app/components/hooks/game/use_server_clock';
import { useT } from '@/app/lib/i18n';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * The duel: two racers, one question, fastest correct answer takes it.
 *
 * This screen has never been reachable. The reducer listened for
 * `duel_question`, a message nothing has ever sent, while the server sends
 * `duel_start` — so a duel drew whatever the previous phase had left on
 * screen. The case exists now; this is what it renders.
 *
 * It is answered with `submit_answer`, the same message a normal question
 * takes — the server routes it to the duel when the phase says duel. There is
 * no separate duel action, and the two that once existed (submit_guess,
 * submit_code) are still unimplemented server-side.
 *
 * `answered` names who has buzzed in, never what they said. That is the whole
 * information the race is about, and the server withholds the rest until it
 * resolves.
 */
export default function ArenaDuel() {
  const { t } = useT();
  const { submitAnswer, username } = useGame();
  const {
    duelPlayers,
    duelAnswered,
    duelAnte,
    players,
    questionText,
    options,
    selectedAnswer,
    answerEndsAt,
    answerDurationMs,
    pot,
  } = useSelector((s: RootState) => s.game);

  const [pending, setPending] = useState<string | null>(null);
  const { seconds } = useCountdown(answerEndsAt, answerDurationMs);

  useEffect(() => {
    setPending(null);
  }, [questionText]);

  const racers = duelPlayers ?? [];
  const answered = duelAnswered ?? [];
  const choices = options ?? [];

  const iAmRacing = Boolean(username) && racers.includes(username as string);
  const iHaveAnswered =
    selectedAnswer !== null ||
    (Boolean(username) && answered.includes(username as string));

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-2 text-center text-[10px] tracking-[0.4em] text-gold uppercase">
        {t('arena.pick.duel')}
      </div>
      <div className="mb-6 text-center">
        <span
          className="text-3xl font-bold text-white tabular-nums"
          role="timer"
        >
          {seconds}
        </span>
        {duelAnte > 0 && (
          <span className="ml-3 text-[11px] tracking-wider text-arena-300 uppercase">
            {t('arena.pick.ante', { amount: money(duelAnte) })}
          </span>
        )}
      </div>

      {/* ========================================================== the two */}
      <div className="mb-8 flex items-center gap-4 sm:gap-6">
        {racers.map((u, i) => {
          const p = players.find((x) => x.username === u);
          const isMe = u === username;
          const buzzed = answered.includes(u);
          return (
            <div key={u} className="contents">
              {i > 0 && (
                <div className="text-2xl font-bold text-arena-400 sm:text-3xl">
                  {t('arena.duel.vs')}
                </div>
              )}
              <div
                className={`flex-1 border bg-arena-800 p-4 text-center sm:p-6 ${
                  isMe ? 'border-gold/30' : 'border-white/10'
                }`}
              >
                <div className="mb-3 flex justify-center">
                  <Avatar
                    name={p?.displayName ?? u}
                    username={u}
                    avatar={p?.avatar}
                    accent={isMe}
                    size="xl"
                  />
                </div>
                <div className="text-lg font-bold text-white">
                  {p?.displayName ?? u}
                </div>
                <div
                  className={`mt-2 text-2xl font-bold tabular-nums ${isMe ? 'text-gold' : 'text-arena-200'}`}
                >
                  {money(p?.money ?? 0)}
                </div>
                {/* that they have answered, never what */}
                <div className="mt-2 text-[10px] tracking-widest uppercase">
                  {buzzed ? (
                    <span className="text-gold">{t('arena.duel.locked')}</span>
                  ) : (
                    <span className="text-arena-400">
                      {t('arena.duel.thinking')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {racers.length === 0 && (
        <p className="mb-6 text-center text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.duel.noRacers')}
        </p>
      )}

      {/* ======================================================== question */}
      <div className="mb-4 border border-white/[0.07] bg-arena-800 p-6">
        <h1 className="mb-6 text-xl font-bold text-white">
          {questionText || '…'}
        </h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {choices.map((option, i) => {
            const picked = iHaveAnswered
              ? option === selectedAnswer
              : option === pending;
            const interactive = iAmRacing && !iHaveAnswered;
            return (
              <button
                key={option}
                type="button"
                onClick={() => interactive && setPending(option)}
                disabled={!interactive}
                aria-pressed={picked}
                className={`flex items-center gap-3 border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
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

      {!iAmRacing && (
        <div className="animate-pulse text-center text-[11px] tracking-wider text-arena-200">
          {t('arena.duel.watching', { pot: money(pot) })}
        </div>
      )}
      {iAmRacing && iHaveAnswered && (
        <div className="text-center text-[11px] tracking-wider text-arena-200 uppercase">
          {t('arena.game.answerLocked')}
        </div>
      )}
      {iAmRacing && !iHaveAnswered && pending !== null && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => submitAnswer(pending)}
            className="cursor-pointer bg-gold px-8 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.duel.buzz')}
          </button>
        </div>
      )}
    </div>
  );
}
