import React from 'react';
import { GamePlayer } from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';
import Avatar from './avatar';

interface PlayerProps {
  player: GamePlayer;
  isCurrentUser: boolean;
  /** show alive/eliminated styling (hidden while still in the lobby) */
  showLifeState: boolean;
  /** currently answering — highlighted */
  active?: boolean;
  /** 'can' shows an add-friend button, 'requested' a pending marker */
  friendState?: 'none' | 'can' | 'requested' | 'friend';
  onAddFriend?: () => void;
  /** host-only: kick this player from the lobby */
  onKick?: () => void;
}

export function Player({
  player,
  isCurrentUser,
  showLifeState,
  active = false,
  friendState = 'none',
  onAddFriend,
  onKick,
}: PlayerProps) {
  const { t } = useT();
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
      <Avatar name={player.username} avatar={player.avatar} />
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <h4 className="font-medium truncate">{player.username}</h4>
          {player.isHost && (
            <span title="Host" aria-label="Host">
              👑
            </span>
          )}
          {player.streak > 0 && (
            <span
              className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded"
              title={t('profile.streakNow')}
            >
              🔥{player.streak}
            </span>
          )}
          {isCurrentUser && (
            <span className="text-sm text-gray-500">{t('game.you')}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>${player.money}</span>
          {eliminated && (
            <span className="text-red-500">{t('game.broke')}</span>
          )}
          {!player.connected && <span>{t('game.offline')}</span>}
        </div>
      </div>
      {friendState === 'can' && (
        <button
          className="text-sm border rounded px-2 py-1 hover:bg-gray-50 cursor-pointer shrink-0"
          onClick={onAddFriend}
          title={t('game.addFriend')}
        >
          ➕
        </button>
      )}
      {friendState === 'requested' && (
        <span className="text-xs text-gray-400 shrink-0">
          {t('game.friendRequested')}
        </span>
      )}
      {onKick && (
        <button
          className="text-sm border border-red-300 text-red-500 rounded px-2 py-1 hover:bg-red-50 cursor-pointer shrink-0"
          onClick={onKick}
          title={t('game.kick')}
        >
          ✕
        </button>
      )}
    </div>
  );
}
