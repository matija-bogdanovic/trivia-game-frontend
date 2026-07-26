'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';
import { useCountdown } from './question_ui';

function FeedbackPegs({ exact, partial }: { exact: number; partial: number }) {
  return (
    <span className="font-mono text-sm">
      <span className="text-green-600">{'●'.repeat(exact)}</span>
      <span className="text-yellow-500">{'○'.repeat(partial)}</span>
    </span>
  );
}

/** mastermind-style race: both duelists crack the same hidden code */
function CodeDuelUI() {
  const { t } = useT();
  const { username, submitCode } = useGame();
  const {
    phase,
    round,
    duelPlayers,
    codeSymbols,
    codeLength,
    maxCodeAttempts,
    myCodeAttempts,
    codeProgress,
    secretCode,
    codeCracked,
    duelWinner,
    duelLoser,
    duelTie,
    duelLoserDelta,
    eliminatedNow,
    answerEndsAt,
    answerDurationMs,
  } = useSelector((state: RootState) => state.game);

  const [draft, setDraft] = useState<string[]>([]);
  const remainingMs = useCountdown(phase === 'duel' ? answerEndsAt : null);
  const amDueling = username !== null && duelPlayers.includes(username);
  const attemptsLeft = maxCodeAttempts - myCodeAttempts.length;
  const fraction =
    remainingMs !== null && answerDurationMs > 0
      ? remainingMs / answerDurationMs
      : null;

  const submitDraft = () => {
    if (draft.length !== codeLength) return;
    submitCode(draft);
    setDraft([]);
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

        <div className="rounded px-3 py-2 text-sm bg-indigo-600 text-white">
          {t('game.codeDuelTitle', {
            a: duelPlayers[0] ?? '',
            b: duelPlayers[1] ?? '',
          })}
        </div>

        {fraction !== null && (
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className={`h-full transition-[width] duration-100 ${
                fraction < 0.25 ? 'bg-red-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${fraction * 100}%` }}
            ></div>
          </div>
        )}

        <p className="text-sm text-gray-600">
          {t('game.codeDuelHint', { n: codeLength })}{' '}
          <span className="text-green-600">●</span> ={' '}
          {t('game.codeExact')}, <span className="text-yellow-500">○</span> ={' '}
          {t('game.codePartial')}
        </p>

        {phase === 'duel' && amDueling && (
          <div className="flex flex-col gap-3 border rounded p-3">
            <div className="flex items-center gap-2">
              {Array.from({ length: codeLength }).map((_, i) => (
                <button
                  key={i}
                  className="w-12 h-12 border-2 rounded flex items-center justify-center text-2xl cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setDraft((d) => d.filter((_, idx) => idx !== i))
                  }
                  title="✕"
                >
                  {draft[i] ?? ''}
                </button>
              ))}
              <button
                className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-indigo-700 disabled:opacity-40"
                disabled={draft.length !== codeLength || attemptsLeft <= 0}
                onClick={submitDraft}
              >
                {t('game.codeSubmit')}
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {codeSymbols.map((s) => (
                <button
                  key={s}
                  className="text-2xl p-1.5 border rounded cursor-pointer hover:bg-gray-50 disabled:opacity-40"
                  disabled={draft.length >= codeLength}
                  onClick={() => setDraft((d) => [...d, s])}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {t('game.codeAttemptsLeft', { n: attemptsLeft })}
            </p>
          </div>
        )}

        {phase === 'duel' && !amDueling && (
          <p className="text-gray-600">
            {t('game.duelWatch', {
              a: duelPlayers[0] ?? '',
              b: duelPlayers[1] ?? '',
            })}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {amDueling && (
            <div className="flex flex-col gap-1">
              <h4 className="font-medium text-sm">{t('game.codeYourTries')}</h4>
              {myCodeAttempts.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xl">{a.guess.join(' ')}</span>
                  <FeedbackPegs exact={a.exact} partial={a.partial} />
                </div>
              ))}
            </div>
          )}
          {duelPlayers
            .filter((p) => p !== username)
            .map((p) => (
              <div key={p} className="flex flex-col gap-1">
                <h4 className="font-medium text-sm">
                  {t('game.codeTheirTries', { name: p })}
                </h4>
                {(codeProgress[p] ?? []).map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-gray-400">
                      {'? '.repeat(codeLength).trim()}
                    </span>
                    <FeedbackPegs exact={a.exact} partial={a.partial} />
                  </div>
                ))}
              </div>
            ))}
        </div>

        {phase === 'reveal' && secretCode && (
          <div className="flex flex-col gap-1 text-gray-800 border-t pt-3">
            <p>
              {t('game.codeWas')}{' '}
              <span className="text-2xl">{secretCode.join(' ')}</span>
            </p>
            <p className="font-medium">
              {duelTie
                ? t('game.duelTie')
                : codeCracked
                  ? t('game.codeCrackedBy', {
                      name: duelWinner ?? '',
                      loser: duelLoser ?? '',
                      n: -duelLoserDelta,
                    })
                  : t('game.duelWin', {
                      name: duelWinner ?? '',
                      loser: duelLoser ?? '',
                      n: -duelLoserDelta,
                    })}
            </p>
            {eliminatedNow.length > 0 && (
              <p className="text-red-600 font-medium">
                {t('game.brokeOut', { names: eliminatedNow.join(', ') })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeDuelUI;
