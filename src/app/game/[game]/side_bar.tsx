'use client';

import { useGame } from '@/app/components/hooks/game/context/game_context';
import ChatUI from '@/app/components/ui/game/chat_ui';
import { Player } from '@/app/components/ui/game/player_ui';
import { RootState } from '@/app/redux/store';
import React from 'react';
import { useSelector } from 'react-redux';

function SideBar() {
  const { username } = useGame();
  const { players, roomName, code, phase, minPlayers, round, answering } =
    useSelector((state: RootState) => state.game);

  const sorted = [...players].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    return b.money - a.money;
  });
  const showLifeState = phase !== 'lobby' && phase !== 'connecting';
  const connectedCount = players.filter((p) => p.connected).length;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <aside className="border border-gray p-4 gap-3 flex flex-col flex-1 overflow-auto">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Players ({players.length})</h4>
        </div>
        {phase === 'connecting' ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Connecting...</span>
          </div>
        ) : (
          <>
            {sorted.map((p) => (
              <Player
                key={p.username}
                player={p}
                isCurrentUser={p.username === username}
                showLifeState={showLifeState}
                active={p.username === answering}
              />
            ))}
            {phase === 'lobby' && connectedCount < minPlayers && (
              <p className="text-sm text-gray-500">
                Waiting for players&hellip; {connectedCount}/{minPlayers}{' '}
                needed to start.
              </p>
            )}
          </>
        )}
      </aside>
      <ChatUI />
      <div className="flex flex-col gap-2 h-auto p-4 border">
        <h4 className="font-semibold">Room information</h4>
        <p>Room name: {roomName || '—'}</p>
        <p>Room code: {code ?? '—'}</p>
        {round > 0 && <p>Round: {round}</p>}
      </div>
    </div>
  );
}

export default SideBar;
