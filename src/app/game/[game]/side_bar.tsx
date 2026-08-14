'use client';

import { useGame } from '@/app/components/hooks/game/context/game_context';
import Avatar from '@/app/components/ui/game/avatar';
import ChatUI from '@/app/components/ui/game/chat_ui';
import { Player } from '@/app/components/ui/game/player_ui';
import { RootState } from '@/app/redux/store';
import { useT } from '@/app/lib/i18n';
import { apiFetch } from '@/app/helpers/api';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

function SideBar() {
  const { t } = useT();
  const { username, kickPlayer, terminateLobby } = useGame();
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!username) return;
    apiFetch('/friends/list')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data)
          setFriends(
            new Set(data.friends.map((f: { username: string }) => f.username))
          );
      })
      .catch(() => {});
  }, [username]);

  const addFriend = (target: string) => {
    if (!username) return;
    setRequested((prev) => new Set(prev).add(target));
    apiFetch('/friends/action', {
      body: { target, action: 'request' },
    }).catch(() => {});
  };
  const {
    players,
    roomName,
    code,
    phase,
    minPlayers,
    maxPlayers,
    round,
    answering,
    isPrivate,
  } = useSelector((state: RootState) => state.game);

  // before the match: everyone sees themselves first, others in join
  // order; once the game runs, ranking is alive-first then by money
  const inLobby =
    phase === 'lobby' || phase === 'countdown' || phase === 'connecting';
  const activePlayers = players.filter((p) => !p.isSpectator);
  const spectators = players.filter((p) => p.isSpectator);
  const sorted = inLobby
    ? [...activePlayers].sort((a, b) => {
        if (a.username === username) return -1;
        if (b.username === username) return 1;
        return 0;
      })
    : [...activePlayers].sort((a, b) => {
        if (a.alive !== b.alive) return a.alive ? -1 : 1;
        return b.money - a.money;
      });
  const showLifeState = phase !== 'lobby' && phase !== 'connecting';
  const connectedCount = players.filter((p) => p.connected).length;
  const iAmHost = players.find((p) => p.username === username)?.isHost ?? false;
  const canModerate = iAmHost && (phase === 'lobby' || phase === 'gameover');

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <aside className="border border-gray p-4 gap-3 flex flex-col flex-1 overflow-auto">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">
            {t('game.players', { n: activePlayers.length, max: maxPlayers })}
          </h4>
        </div>
        {phase === 'connecting' ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">{t('game.connecting')}</span>
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
                friendState={
                  p.username === username || !username
                    ? 'none'
                    : friends.has(p.username)
                      ? 'friend'
                      : requested.has(p.username)
                        ? 'requested'
                        : 'can'
                }
                onAddFriend={() => addFriend(p.username)}
                onKick={
                  canModerate && p.username !== username
                    ? () => kickPlayer(p.username)
                    : undefined
                }
              />
            ))}
            {phase === 'lobby' && connectedCount < minPlayers && (
              <p className="text-sm text-gray-500">
                {t('game.waitingPlayers', {
                  a: connectedCount,
                  b: minPlayers,
                })}
              </p>
            )}
            {spectators.length > 0 && (
              <div className="flex flex-col gap-1 border-t pt-2 mt-1">
                <h5 className="text-sm font-medium text-gray-500">
                  {t('game.spectators', { n: spectators.length })}
                </h5>
                {spectators.map((s) => (
                  <div
                    key={s.username}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Avatar
                      name={s.displayName}
                      username={s.username}
                      avatar={s.avatar}
                      size={24}
                    />
                    <span className="truncate">
                      {s.displayName}
                      {s.username === username && <> {t('game.you')}</>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </aside>
      <ChatUI />
      <div className="flex flex-col gap-2 h-auto p-4 border">
        <h4 className="font-semibold">{t('game.roomInfo')}</h4>
        <p>
          {isPrivate ? '🔒' : '🌐'}{' '}
          {t('game.roomName', { name: roomName || '—' })}
        </p>
        <p>{t('game.roomCode', { code: code ?? '—' })}</p>
        {round > 0 && <p>{t('game.round', { n: round })}</p>}
        {canModerate &&
          (confirmTerminate ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-red-600">
                {t('game.terminateConfirm')}
              </p>
              <div className="flex gap-2">
                <button
                  className="bg-red-600 text-white text-sm px-3 py-1 rounded cursor-pointer"
                  onClick={terminateLobby}
                >
                  {t('game.terminate')}
                </button>
                <button
                  className="border text-sm px-3 py-1 rounded cursor-pointer"
                  onClick={() => setConfirmTerminate(false)}
                >
                  {t('game.stay')}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="text-sm text-red-500 border border-red-300 rounded px-3 py-1 hover:bg-red-50 cursor-pointer self-start"
              onClick={() => setConfirmTerminate(true)}
            >
              {t('game.terminate')}
            </button>
          ))}
      </div>
    </div>
  );
}

export default SideBar;
