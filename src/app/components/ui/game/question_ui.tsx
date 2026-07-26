'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';
import BettingPanel from './betting_panel';
import CodeDuelUI from './code_duel_ui';
import DuelUI from './duel_ui';

export function useCountdown(endsAt: number | null) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setRemainingMs(null);
      return;
    }
    const tick = () => setRemainingMs(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [endsAt]);

  return remainingMs;
}

function TimerBar({
  remainingMs,
  durationMs,
}: {
  remainingMs: number | null;
  durationMs: number;
}) {
  if (remainingMs === null || durationMs <= 0) return null;
  const fraction = remainingMs / durationMs;
  return (
    <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
      <div
        className={`h-full transition-[width] duration-100 ${
          fraction < 0.25 ? 'bg-red-500' : 'bg-blue-500'
        }`}
        style={{ width: `${fraction * 100}%` }}
      ></div>
    </div>
  );
}

function QuestionUI() {
  const { t } = useT();
  const { submitAnswer, pickPlayer, username } = useGame();
  const game = useSelector((state: RootState) => state.game);
  const {
    phase,
    round,
    chainDepth,
    difficulty,
    answering,
    questionText,
    options,
    selectedAnswer,
    correctAnswer,
    lastAnswer,
    lastCorrect,
    timedOut,
    answererDelta,
    answerEndsAt,
    answerDurationMs,
    betEndsAt,
    betDurationMs,
    betOutcomes,
    eliminatedNow,
    picker,
    pickChoices,
    pickEndsAt,
    pickDurationMs,
  } = game;

  const answerRemaining = useCountdown(
    phase === 'question' ? answerEndsAt : null
  );
  const betRemaining = useCountdown(phase === 'betting' ? betEndsAt : null);
  const pickRemaining = useCountdown(phase === 'picking' ? pickEndsAt : null);

  if (
    phase === 'connecting' ||
    phase === 'lobby' ||
    phase === 'countdown' ||
    phase === 'gameover'
  ) {
    return (
      <div className="h-full flex flex-col w-full justify-center items-center text-gray-600">
        {phase === 'gameover' ? null : <span>{t('game.waitingHost')}</span>}
      </div>
    );
  }

  if (phase === 'spin') {
    return (
      <div className="h-full flex flex-col w-full justify-center items-center text-gray-600">
        <span>{t('game.spinning')}</span>
      </div>
    );
  }

  // duels (and their reveals) render their own UI
  if (phase === 'duel' || (phase === 'reveal' && game.duelKind !== null)) {
    if (game.duelKind === 'code') return <CodeDuelUI />;
    return <DuelUI />;
  }

  const isAnswerer = username === answering;

  const optionClass = (option: string): string => {
    const base =
      'border rounded p-3 text-left transition duration-150 w-full disabled:cursor-not-allowed';
    if (phase === 'reveal' && correctAnswer) {
      if (option === correctAnswer) return `${base} bg-green-500 text-white`;
      if (!lastCorrect && option === lastAnswer)
        return `${base} bg-red-500 text-white`;
      return `${base} opacity-60`;
    }
    if (isAnswerer && option === selectedAnswer) {
      return `${base} border-blue-600 bg-blue-50`;
    }
    return isAnswerer ? `${base} hover:bg-gray-50 cursor-pointer` : base;
  };

  return (
    <div className="flex flex-col gap-4 h-full w-full justify-start items-center overflow-y-auto">
      <div className="flex flex-col w-full gap-4 max-w-2xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{t('game.question', { n: round })}</span>
            {chainDepth > 0 && (
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                {t('game.chain', { n: chainDepth })}
              </span>
            )}
            <span title="Difficulty">{'★'.repeat(difficulty)}</span>
          </div>
          {phase === 'question' && answerRemaining !== null && (
            <span className="text-sm font-mono">
              {Math.ceil(answerRemaining / 1000)}s
            </span>
          )}
        </div>

        {phase === 'question' && (
          <TimerBar remainingMs={answerRemaining} durationMs={answerDurationMs} />
        )}

        <div
          className={`rounded px-3 py-2 text-sm ${
            isAnswerer
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {phase === 'betting'
            ? isAnswerer
              ? t('game.betsWaitSelf')
              : t('game.betsWait', { name: answering ?? '' })
            : isAnswerer
              ? t('game.yourTurn')
              : t('game.answering', { name: answering ?? '' })}
        </div>

        {phase === 'betting' && (
          <TimerBar remainingMs={betRemaining} durationMs={betDurationMs} />
        )}

        <strong className="text-[20px]">{questionText}</strong>
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option}
              className={optionClass(option)}
              disabled={
                phase !== 'question' || !isAnswerer || selectedAnswer !== null
              }
              onClick={() => submitAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {(phase === 'question' || phase === 'betting') && !isAnswerer && (
          <BettingPanel />
        )}

        {phase === 'question' && isAnswerer && selectedAnswer !== null && (
          <p className="text-gray-600">{t('game.answerLocked')}</p>
        )}

        {phase === 'reveal' && (
          <div className="flex flex-col gap-1 text-gray-800 border-t pt-3">
            <p>
              {lastCorrect
                ? t('game.correctPicks', { name: answering ?? '' })
                : t(timedOut ? 'game.timeoutLoses' : 'game.wrongLoses', {
                    name: answering ?? '',
                    n: -answererDelta,
                  })}
            </p>
            {betOutcomes.map((b) => (
              <p key={b.username} className="text-sm">
                {t(b.won ? 'game.betWon' : 'game.betLost', {
                  name: b.username,
                  n: b.amount,
                  bet: t(b.bet === 'correct' ? 'game.correctly' : 'game.wrong'),
                })}
              </p>
            ))}
            {eliminatedNow.length > 0 && (
              <p className="text-red-600 font-medium">
                {t('game.brokeOut', { names: eliminatedNow.join(', ') })}
              </p>
            )}
          </div>
        )}

        {phase === 'picking' && (
          <div className="flex flex-col gap-3 border-t pt-3">
            {username === picker ? (
              <>
                <p className="font-medium">{t('game.pickPrompt')}</p>
                <div className="flex flex-wrap gap-2">
                  {pickChoices.map((name) => (
                    <button
                      key={name}
                      className="border rounded px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => pickPlayer(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-600">
                {t('game.picking', { name: picker ?? '' })}
              </p>
            )}
            {pickRemaining !== null && (
              <TimerBar remainingMs={pickRemaining} durationMs={pickDurationMs} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionUI;
