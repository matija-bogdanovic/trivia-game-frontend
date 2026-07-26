'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import BettingPanel from './betting_panel';

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
        {phase === 'gameover' ? null : (
          <span>Waiting for the host to start the game&hellip;</span>
        )}
      </div>
    );
  }

  if (phase === 'spin') {
    return (
      <div className="h-full flex flex-col w-full justify-center items-center text-gray-600">
        <span>Spinning to pick who answers&hellip;</span>
      </div>
    );
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
            <span>Question {round}</span>
            {chainDepth > 0 && (
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                🔥 chain ×{chainDepth}
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
              ? 'Answer locked in — waiting for players to make their bets…'
              : `Waiting for players to make their bets on ${answering}…`
            : isAnswerer
              ? '🎯 Your turn — answer the question!'
              : `${answering} is answering…`}
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
          <p className="text-gray-600">Answer locked in&hellip;</p>
        )}

        {phase === 'reveal' && (
          <div className="flex flex-col gap-1 text-gray-800 border-t pt-3">
            {lastCorrect ? (
              <p>
                ✅ <strong>{answering}</strong> answered correctly and gets to
                pick who&apos;s next!
              </p>
            ) : (
              <p>
                ❌ <strong>{answering}</strong>{' '}
                {timedOut ? 'ran out of time' : 'answered wrong'} and loses{' '}
                <strong>${-answererDelta}</strong>. The wheel spins again&hellip;
              </p>
            )}
            {betOutcomes.map((b) => (
              <p key={b.username} className="text-sm">
                {b.won ? '💰' : '💸'} {b.username} bet ${b.amount} on &quot;
                {b.bet}&quot; and {b.won ? 'won' : 'lost'} ${b.amount}
              </p>
            ))}
            {eliminatedNow.length > 0 && (
              <p className="text-red-600 font-medium">
                Out of money and eliminated: {eliminatedNow.join(', ')}
              </p>
            )}
          </div>
        )}

        {phase === 'picking' && (
          <div className="flex flex-col gap-3 border-t pt-3">
            {username === picker ? (
              <>
                <p className="font-medium">
                  Pick who gets the next (harder) question:
                </p>
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
                <strong>{picker}</strong> is choosing who answers next&hellip;
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
