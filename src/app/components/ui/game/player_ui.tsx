import React from 'react';
import { GamePlayer } from '@/app/redux/slicers/game_slice';
import Avatar from './avatar';

interface PlayerProps {
  player: GamePlayer;
  isCurrentUser: boolean;
  /** show alive/eliminated styling (hidden while still in the lobby) */
  showLifeState: boolean;
  /** currently answering — highlighted */
  active?: boolean;
}

export function Player({
  player,
  isCurrentUser,
  showLifeState,
  active = false,
}: PlayerProps) {
  const eliminated = showLifeState && !player.alive;
  return (
    <div
      className={`flex items-center gap-3 border rounded p-2 transition duration-150 ${
        eliminated ? 'opacity-40 grayscale' : ''
      } ${active ? 'ring-2 ring-blue-500' : ''} ${
        player.connected
          ? 'border-black'
          : 'border-dashed border-gray-400 opacity-60'
      }`}
    >
      <Avatar name={player.username} />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <h4 className="font-medium truncate">{player.username}</h4>
          {player.isHost && (
            <span title="Host" aria-label="Host">
              👑
            </span>
          )}
          {isCurrentUser && (
            <span className="text-sm text-gray-500">(you)</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>${player.money}</span>
          {eliminated && <span className="text-red-500">broke</span>}
          {!player.connected && <span>offline</span>}
        </div>
      </div>
    </div>
  );
}
