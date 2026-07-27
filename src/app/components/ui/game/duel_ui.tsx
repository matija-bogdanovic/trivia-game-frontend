'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { useCountdown } from './question_ui';

/** head-to-head closest-guess round: both duelists type a number */
function DuelUI() {
  const { t } = useT();
  const { username, submitGuess } = useGame();
  const {
    phase,
    round,
    questionText,
    duelPlayers,
    answerEndsAt,
    answerDurationMs,
    myGuessSubmitted,
    correctValue,
    duelGuesses,
    duelWinner,
    duelLoser,
    duelTie,
    duelLoserDelta,
    eliminatedNow,
    players,
  } = useSelector((state: RootState) => state.game);
  const nameOf = (u: string | null | undefined) => displayNameOf(players, u);
  const [guess, setGuess] = useState('');
  const remainingMs = useCountdown(phase === 'duel' ? answerEndsAt : null);

  const amDueling = username !== null && duelPlayers.includes(username);
  const fraction =
    remainingMs !== null && answerDurationMs > 0
      ? remainingMs / answerDurationMs
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(guess);
    if (!Number.isFinite(value)) return;
    submitGuess(value);
  };

  return (
    <div className="flex flex-col gap-4 h-full w-full justify-start items-center overflow-y-auto">
      <div className="flex flex-col w-full gap-4 max-w-2xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-gray-500">
            {t('game.question', { n: round })}
          </span>
          {phase === 'duel' && remainingMs !== null && (
            <span className="text-sm font-mono">
              {Math.ceil(remainingMs / 1000)}s
            </span>
          )}
        </div>

        <div className="rounded px-3 py-2 text-sm bg-purple-600 text-white">
          {t('game.duelTitle', {
            a: nameOf(duelPlayers[0]),
            b: nameOf(duelPlayers[1]),
          })}
        </div>

        {fraction !== null && (
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className={`h-full transition-[width] duration-100 ${
                fraction < 0.25 ? 'bg-red-500' : 'bg-purple-500'
              }`}
              style={{ width: `${fraction * 100}%` }}
            ></div>
          </div>
        )}

        <strong className="text-[20px]">{questionText}</strong>

        {phase === 'duel' &&
          (amDueling ? (
            myGuessSubmitted ? (
              <p className="text-gray-600">{t('game.guessLocked')}</p>
            ) : (
              <form className="flex gap-2" onSubmit={handleSubmit}>
                <input
                  type="number"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder={t('game.guessPlaceholder')}
                  className="border border-gray-300 rounded px-3 py-2 w-48"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={guess.trim() === ''}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition cursor-pointer disabled:opacity-40"
                >
                  {t('game.guessSubmit')}
                </button>
              </form>
            )
          ) : (
            <p className="text-gray-600">
              {t('game.duelWatch', {
                a: nameOf(duelPlayers[0]),
                b: nameOf(duelPlayers[1]),
              })}
            </p>
          ))}

        {phase === 'reveal' && correctValue !== null && (
          <div className="flex flex-col gap-1 text-gray-800 border-t pt-3">
            <p>
              {t('game.correctValue', { n: correctValue })}
            </p>
            {duelGuesses.map((g) => (
              <p key={g.username} className="text-sm">
                {g.guess === null
                  ? t('game.noGuess', { name: nameOf(g.username) })
                  : t('game.duelGuess', {
                      name: nameOf(g.username),
                      g: g.guess,
                      d: g.diff ?? 0,
                    })}
              </p>
            ))}
            <p className="font-medium">
              {duelTie
                ? t('game.duelTie')
                : t('game.duelWin', {
                    name: nameOf(duelWinner),
                    loser: nameOf(duelLoser),
                    n: -duelLoserDelta,
                  })}
            </p>
            {eliminatedNow.length > 0 && (
              <p className="text-red-600 font-medium">
                {t('game.brokeOut', {
                  names: eliminatedNow.map(nameOf).join(', '),
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DuelUI;
