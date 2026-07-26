'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';

function useCountdown(endsAt: number | null) {
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

function QuestionUI() {
  const { submitAnswer } = useGame();
  const {
    phase,
    round,
    questionText,
    options,
    selectedAnswer,
    correctAnswer,
    answerEndsAt,
    answerDurationMs,
    results,
    everyoneSpared,
  } = useSelector((state: RootState) => state.game);

  const remainingMs = useCountdown(phase === 'question' ? answerEndsAt : null);

  if (phase === 'connecting' || phase === 'lobby' || phase === 'countdown') {
    return (
      <div className="h-full flex flex-col w-full justify-center items-center text-gray-600">
        <span>Waiting for the host to start the game&hellip;</span>
      </div>
    );
  }

  if (phase === 'gameover') {
    return <div className="h-full w-full" />;
  }

  const timeFraction =
    remainingMs !== null && answerDurationMs > 0
      ? remainingMs / answerDurationMs
      : null;

  const optionClass = (option: string): string => {
    const base =
      'border rounded p-3 text-left transition duration-150 w-full cursor-pointer disabled:cursor-not-allowed';
    if (phase === 'reveal' && correctAnswer) {
      if (option === correctAnswer) return `${base} bg-green-500 text-white`;
      if (option === selectedAnswer) return `${base} bg-red-500 text-white`;
      return `${base} opacity-60`;
    }
    if (option === selectedAnswer) {
      return `${base} border-blue-600 bg-blue-50`;
    }
    return `${base} hover:bg-gray-50`;
  };

  const eliminatedThisRound = results
    .filter((r) => r.eliminated)
    .map((r) => r.username);

  return (
    <div className="flex flex-col gap-4 h-full w-full justify-start items-center">
      <div className="flex flex-col w-full gap-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Round {round}</span>
          {phase === 'question' && remainingMs !== null && (
            <span className="text-sm font-mono">
              {Math.ceil(remainingMs / 1000)}s
            </span>
          )}
        </div>
        {timeFraction !== null && (
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className={`h-full transition-[width] duration-100 ${
                timeFraction < 0.25 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${timeFraction * 100}%` }}
            ></div>
          </div>
        )}
        <strong className="text-[20px]">{questionText}</strong>
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option}
              className={optionClass(option)}
              disabled={phase !== 'question' || selectedAnswer !== null}
              onClick={() => submitAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {phase === 'question' && selectedAnswer !== null && (
          <p className="text-gray-600">
            Answer locked in — waiting for the other players&hellip;
          </p>
        )}
        {phase === 'reveal' && (
          <div className="flex flex-col gap-1 text-gray-800">
            {everyoneSpared ? (
              <p>Nobody got it right — everyone survives this round!</p>
            ) : eliminatedThisRound.length > 0 ? (
              <p>
                Eliminated this round:{' '}
                <strong>{eliminatedThisRound.join(', ')}</strong>
              </p>
            ) : (
              <p>Everyone answered correctly — nobody was eliminated.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionUI;
