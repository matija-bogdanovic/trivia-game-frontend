'use client';

import Button from '@/app/components/general/button';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { RootState } from '@/app/redux/store';
import { useT } from '@/app/lib/i18n';
import React from 'react';
import { useSelector } from 'react-redux';

function StartButton() {
  const { t } = useT();
  const { startGame, username } = useGame();
  const { phase, players, minPlayers } = useSelector(
    (state: RootState) => state.game
  );

  const me = players.find((p) => p.username === username);
  if (phase !== 'lobby' || !me?.isHost) return null;

  const connectedCount = players.filter((p) => p.connected).length;
  const enoughPlayers = connectedCount >= minPlayers;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end gap-1">
      <div className={enoughPlayers ? '' : 'opacity-40'}>
        <Button
          text={t('game.start')}
          onClick={startGame}
          disabled={!enoughPlayers}
        />
      </div>
      {!enoughPlayers && (
        <span className="text-sm text-gray-500 bg-white/80 px-2 py-1 rounded">
          {t('game.needPlayers', { n: minPlayers })}
        </span>
      )}
    </div>
  );
}

export default StartButton;
