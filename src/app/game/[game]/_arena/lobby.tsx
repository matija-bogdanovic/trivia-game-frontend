'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { RootState } from '@/app/redux/store';
import AvatarTile from './avatar_tile';

/**
 * The arena Lobby design, driven by the real lobby_state the game server
 * pushes. The design's local `players` / `chatMessages` arrays are gone; both
 * come off game_slice now.
 *
 * Where the design and the real game disagree (see the P3 Tier 2 report):
 *  - there is no per-player "ready" flag, so the readiness column reflects
 *    `connected` and is labelled for what it actually is;
 *  - players carry money + streak, not a win count;
 *  - the room has no category / difficulty / starting-money settings, so the
 *    header shows what a room really has: seats, and public vs private.
 */
export default function ArenaLobby() {
  const {
    username,
    startGame,
    kickPlayer,
    terminateLobby,
    sendChat,
    leaveRoom,
  } = useGame();
  const {
    roomName,
    code,
    players,
    minPlayers,
    maxPlayers,
    isPrivate,
    chatMessages,
    phase,
    countdown,
  } = useSelector((state: RootState) => state.game);

  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [chatMessages.length]);

  const send = () => {
    if (!message.trim()) return;
    sendChat(message);
    setMessage('');
  };

  const seated = players.filter((p) => !p.isSpectator);
  const spectators = players.filter((p) => p.isSpectator);
  const connectedCount = seated.filter((p) => p.connected).length;
  const iAmHost = players.find((p) => p.username === username)?.isHost ?? false;
  const canStart = iAmHost && connectedCount >= minPlayers;
  const emptySlots = Math.max(0, maxPlayers - seated.length);

  const copyCode = () => {
    if (code === null) return;
    navigator.clipboard?.writeText(String(code)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {}
    );
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
            {phase === 'countdown' ? 'Starting' : 'Waiting for players'}
          </div>
          <h1 className="text-3xl font-bold tracking-wide">
            {roomName || 'ROOM'}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-arena-200 text-[11px] tracking-wider">
            <span>
              {seated.length} / {maxPlayers} seats · {minPlayers} to start
            </span>
            <span className="border border-arena-400 px-2 py-0.5 text-[9px] tracking-widest uppercase">
              {isPrivate ? 'PRIVATE' : 'PUBLIC'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-arena-200 text-[10px] tracking-[0.2em] uppercase mb-1">
            Room Code
          </div>
          <button
            onClick={copyCode}
            className="text-3xl font-bold text-gold tracking-[0.3em] hover:text-gold-light transition-colors"
            title="Copy room code"
          >
            {code === null ? '······' : String(code)}
          </button>
          <div className="text-arena-300 text-[10px] tracking-wider uppercase mt-1">
            {copied ? '✓ Copied' : 'Click to copy'}
          </div>
        </div>
      </div>

      {/* Connected bar */}
      <div className="bg-arena-800 border border-white/[0.07] px-5 py-3 mb-6 flex items-center gap-4">
        <div className="text-arena-200 text-[11px] tracking-wider uppercase flex-1">
          {connectedCount} / {seated.length} players connected
        </div>
        <div className="flex gap-1">
          {seated.map((p) => (
            <div
              key={p.username}
              className={`w-2 h-2 ${p.connected ? 'bg-gold' : 'bg-arena-500'}`}
            />
          ))}
        </div>
        <div
          className={`text-[11px] tracking-wider font-bold ${connectedCount >= minPlayers ? 'text-gold' : 'text-arena-300'}`}
        >
          {phase === 'countdown' && countdown !== null
            ? `STARTING IN ${countdown}`
            : connectedCount >= minPlayers
              ? 'READY TO START'
              : `NEED ${minPlayers - connectedCount} MORE`}
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Player grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-3">
            Players
          </div>
          <div className="grid grid-cols-2 gap-3">
            {seated.map((player) => {
              const isMe = player.username === username;
              return (
                <div
                  key={player.username}
                  className={`bg-arena-800 border p-5 relative ${
                    isMe ? 'border-gold/30' : 'border-white/[0.07]'
                  }`}
                >
                  {player.isHost && (
                    <div className="absolute top-3 right-3 text-[9px] tracking-widest text-gold border border-gold/40 px-2 py-0.5 uppercase">
                      HOST
                    </div>
                  )}
                  {isMe && !player.isHost && (
                    <div className="absolute top-3 right-3 text-[9px] tracking-widest text-arena-200 border border-arena-400 px-2 py-0.5 uppercase">
                      YOU
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <AvatarTile
                      username={player.username}
                      displayName={player.displayName}
                      avatar={player.avatar}
                      accent={player.isHost}
                      className="w-12 h-12 text-lg"
                    />
                    <div className="min-w-0">
                      <div className="text-white font-bold truncate">
                        {player.displayName}
                      </div>
                      <div className="text-gold text-[11px]">
                        🔥 {player.streak} streak
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-arena-200 text-[11px]">
                      <span className="text-white font-bold">
                        ${player.money}
                      </span>{' '}
                      bank
                    </div>
                    <div
                      className={`text-[10px] tracking-widest font-bold uppercase px-3 py-1 border ${
                        player.connected
                          ? 'border-gold/40 text-gold'
                          : 'border-arena-400 text-arena-300'
                      }`}
                    >
                      {player.connected ? '✓ IN ROOM' : 'AWAY'}
                    </div>
                  </div>

                  {iAmHost && !isMe && (
                    <button
                      onClick={() => kickPlayer(player.username)}
                      className="mt-3 w-full text-[10px] tracking-wider uppercase text-arena-300 border border-arena-500 py-1.5 hover:text-white hover:border-arena-300 transition-colors"
                    >
                      REMOVE
                    </button>
                  )}
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={i}
                className="bg-arena-750 border border-white/[0.04] p-5 flex items-center justify-center"
              >
                <div className="text-arena-500 text-[11px] tracking-widest uppercase">
                  Waiting for player...
                </div>
              </div>
            ))}
          </div>

          {spectators.length > 0 && (
            <div className="mt-4 text-arena-300 text-[11px] tracking-wider uppercase">
              {spectators.length} spectating ·{' '}
              {spectators.map((s) => s.displayName).join(', ')}
            </div>
          )}

          {/* Host controls */}
          <div className="mt-6 flex gap-3 items-center">
            {iAmHost ? (
              <button
                onClick={startGame}
                disabled={!canStart || phase === 'countdown'}
                className={`font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-4 transition-colors ${
                  canStart && phase !== 'countdown'
                    ? 'bg-gold text-arena-950 hover:bg-gold-light'
                    : 'bg-arena-700 text-arena-400 cursor-not-allowed'
                }`}
              >
                START GAME →
              </button>
            ) : (
              <div className="text-arena-300 text-[11px] tracking-[0.15em] uppercase">
                Waiting for the host to start
              </div>
            )}
            <button
              onClick={leaveRoom}
              className="border border-white/10 text-arena-200 text-[11px] tracking-[0.15em] uppercase px-5 py-4 hover:bg-arena-700 hover:text-white transition-colors ml-auto"
            >
              LEAVE ROOM
            </button>
            {iAmHost && (
              <button
                onClick={terminateLobby}
                className="border border-white/10 text-arena-200 text-[11px] tracking-[0.15em] uppercase px-5 py-4 hover:bg-arena-700 hover:text-white transition-colors"
              >
                CLOSE ROOM
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="w-72 flex flex-col bg-arena-800 border border-white/[0.07] min-h-0">
          <div className="px-4 py-3 border-b border-white/[0.07]">
            <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200">
              Lobby Chat
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i}>
                {msg.username === null ? (
                  <div className="text-arena-400 text-[11px] italic">
                    {msg.text}
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span
                        className={`text-[11px] font-bold ${msg.username === username ? 'text-gold' : 'text-white'}`}
                      >
                        {msg.displayName ?? msg.username}
                      </span>
                      <span className="text-arena-400 text-[10px]">
                        {new Date(msg.at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-arena-100 text-[12px] leading-relaxed break-words">
                      {msg.text}
                    </div>
                  </>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-white/[0.07] p-3 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Message..."
              className="flex-1 bg-arena-750 border border-white/10 text-white text-xs px-3 py-2 outline-none focus:border-gold/30 placeholder:text-arena-400 min-w-0"
            />
            <button
              onClick={send}
              className="bg-arena-600 text-white px-3 py-2 text-xs hover:bg-arena-500 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
