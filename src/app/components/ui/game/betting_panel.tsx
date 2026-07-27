'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';
import { displayNameOf } from '@/app/redux/slicers/game_slice';

const MIN_BET = 10;

function BettingPanel() {
  const { t } = useT();
  const { placeBet, username } = useGame();
  const { players, answering, myBet } = useSelector(
    (state: RootState) => state.game
  );
  const me = players.find((p) => p.username === username);
  const nameOf = (u: string | null | undefined) => displayNameOf(players, u);
  const [amount, setAmount] = useState(50);

  if (!me || !me.alive || me.money < MIN_BET || username === answering) {
    return null;
  }

  if (myBet) {
    return (
      <div className="border rounded p-3 bg-gray-50 text-sm text-gray-700">
        {myBet.kind === 'neutral' ? (
          <span>{t('game.neutralStay')}</span>
        ) : (
          <span>
            {t('game.yourBet', {
              n: myBet.amount,
              name: nameOf(answering),
              bet: t(
                myBet.bet === 'correct' ? 'game.correctly' : 'game.wrong'
              ),
            })}
          </span>
        )}
      </div>
    );
  }

  const clamped = Math.min(Math.max(MIN_BET, amount || MIN_BET), me.money);
  const quickAmounts = [50, 100, 250].filter((a) => a <= me.money);

  return (
    <div className="border rounded p-3 flex flex-col gap-3 bg-gray-50">
      <p className="text-sm font-medium">
        {t('game.betOn', { name: nameOf(answering), n: me.money })}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number"
          min={MIN_BET}
          max={me.money}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 w-24 text-sm"
          aria-label="Bet amount"
        />
        {quickAmounts.map((a) => (
          <button
            key={a}
            className="border rounded px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
            onClick={() => setAmount(a)}
          >
            ${a}
          </button>
        ))}
        <button
          className="border rounded px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
          onClick={() => setAmount(me.money)}
        >
          {t('game.allIn', { n: me.money })}
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          className="bg-green-600 text-white rounded px-3 py-1.5 text-sm hover:bg-green-700 cursor-pointer"
          onClick={() => placeBet('correct', clamped)}
        >
          {t('game.betCorrect', { n: clamped })}
        </button>
        <button
          className="bg-red-600 text-white rounded px-3 py-1.5 text-sm hover:bg-red-700 cursor-pointer"
          onClick={() => placeBet('wrong', clamped)}
        >
          {t('game.betWrong', { n: clamped })}
        </button>
        <button
          className="border rounded px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
          onClick={() => placeBet('neutral', 0)}
        >
          {t('game.neutral')}
        </button>
      </div>
    </div>
  );
}

export default BettingPanel;
