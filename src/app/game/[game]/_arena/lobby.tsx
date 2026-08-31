'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import { useT } from '@/app/lib/i18n';
import InviteFriends from './invite_friends';
import {
  CheckIcon,
  FlameIcon,
  GlobeIcon,
  LockIcon,
  PaperPlaneIcon,
  UserPlusIcon,
  XIcon,
} from '@/app/(arena)/_components/icons';

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
  const { t } = useT();
  const {
    username,
    isHost: iAmHost,
    startGame,
    kickPlayer,
    terminateLobby,
    sendChat,
    leaveRoom,
  } = useGame();
  const [inviting, setInviting] = useState(false);
  const inviteSentTo = useSelector((st: RootState) => st.invite.sent);
  const inviteResult = useSelector((st: RootState) => st.invite.result);
  /*
   * The server answers a refusal with a code and a target; this turns the pair
   * into the sentence the sender reads. Naming the person is the point — "X
   * trenutno nije onlajn" is actionable where "invite failed" is not.
   */
  const inviteNotice = (() => {
    if (!inviteResult?.reason) return null;
    const name = inviteResult.target;
    switch (inviteResult.reason) {
      case 'offline':
        return t('arena.invite.err.offline', { name });
      case 'already-here':
        return t('arena.invite.err.alreadyHere', { name });
      case 'room-full':
        return t('arena.invite.err.roomFull');
      case 'not-friend':
        return t('arena.invite.err.notFriend');
      case 'room-gone':
        return t('arena.invite.err.roomGone');
      default:
        return t('arena.invite.err.generic');
    }
  })();
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
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  /** the player the host is about to remove, held for the confirm */
  const [confirmingKick, setConfirmingKick] = useState<{
    username: string;
    name: string;
  } | null>(null);
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

  /*
   * A full room has nowhere to put a friend.
   *
   * Counted from the SEATED players against the room's own maxPlayers, not a
   * constant: rooms are created with two to eight seats, and a four-seat room
   * is full at four. Spectators are excluded — they are not in a seat, so they
   * do not fill one.
   *
   * maxPlayers can be null on a room written before the field existed; that
   * reads as "no known cap", and a cap nobody knows is not one to enforce in
   * the UI. The server refuses on its own either way.
   */
  const roomFull = maxPlayers !== null && seated.length >= maxPlayers;
  /*
   * Capacity is the server's to state. Until lobby_state arrives both limits
   * are null, and everything derived from them is withheld rather than
   * guessed — no empty seats drawn against an assumed six, no "need N more"
   * against an assumed two. The seats that ARE drawn are the real roster.
   */
  const enoughToStart = minPlayers === null || connectedCount >= minPlayers;
  const canStart = iAmHost && enoughToStart;
  const emptySlots =
    maxPlayers === null ? 0 : Math.max(0, maxPlayers - seated.length);

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
    <div className="flex h-full flex-col p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
            {phase === 'countdown'
              ? t('arena.lobby.starting')
              : t('arena.lobby.waiting')}
          </div>
          <h1 className="text-2xl font-bold tracking-wide sm:text-3xl">
            {roomName || 'ROOM'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] tracking-wider text-arena-200">
            <span>
              {maxPlayers === null || minPlayers === null
                ? t('arena.lobby.seatsNoMax', { n: seated.length })
                : t('arena.lobby.seats', {
                    n: seated.length,
                    max: maxPlayers,
                    min: minPlayers,
                  })}
            </span>
            <span
              className={`flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[9px] tracking-widest uppercase ${
                isPrivate
                  ? 'border-gold/40 text-gold'
                  : 'border-frost/40 text-frost'
              }`}
            >
              {isPrivate ? (
                <LockIcon className="h-2.5 w-2.5 shrink-0" />
              ) : (
                <GlobeIcon className="h-2.5 w-2.5 shrink-0" />
              )}
              {isPrivate ? t('arena.common.private') : t('arena.common.public')}
            </span>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="text-arena-200 text-[10px] tracking-[0.2em] uppercase mb-1">
            {t('arena.common.roomCode')}
          </div>
          <button
            onClick={copyCode}
            className="cursor-pointer text-2xl font-bold tracking-[0.3em] text-gold tabular-nums transition-colors hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:text-3xl"
            title={t('arena.lobby.copyCode')}
          >
            {code === null ? '······' : String(code)}
          </button>
          <div className="text-arena-300 mt-1 flex items-center justify-center gap-1.5 text-[10px] tracking-wider uppercase">
            {copied && <CheckIcon className="h-3 w-3 shrink-0" />}
            {copied ? t('arena.lobby.copied') : t('arena.lobby.clickToCopy')}
          </div>
        </div>
      </div>

      {/* Connected bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-sm border border-white/[0.07] bg-arena-800 px-5 py-3">
        {/*
          Two different numbers, both real and both worth stating: how many
          players hold a socket right now (active), and how many seats the
          roster occupies. A player who dropped is still seated — counting
          them as present would overstate the room, and dropping them from
          the roster would understate it.
        */}
        <div
          className="flex-1 text-[11px] tracking-wider text-arena-200 uppercase"
          aria-live="polite"
        >
          {t('arena.lobby.activePlayers', {
            n: connectedCount,
            total: seated.length,
          })}
          {maxPlayers !== null && (
            <span className="ml-2 text-arena-300">
              {t('arena.lobby.ofCapacity', { max: maxPlayers })}
            </span>
          )}
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {seated.map((p) => (
            <div
              key={p.username}
              className={`w-2 h-2 ${p.connected ? 'bg-gold' : 'bg-arena-500'}`}
            />
          ))}
        </div>
        <div
          className={`text-[11px] font-bold tracking-wider ${enoughToStart ? 'text-gold' : 'text-arena-300'}`}
        >
          {phase === 'countdown' && countdown !== null
            ? t('arena.lobby.startingIn', { n: countdown })
            : minPlayers === null
              ? ''
              : connectedCount >= minPlayers
                ? t('arena.lobby.readyToStart')
                : t('arena.lobby.needMore', { n: minPlayers - connectedCount })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 xl:flex-row">
        {/* Player grid */}
        <div className="flex-1 overflow-y-auto">
          {/*
            Invite sits with the roster, not with the room controls: it is a
            way of filling those empty seats, and it is the seats you are
            looking at when you notice they are empty.

            Not host-only. Anyone waiting can pull a friend in — the server
            checks that the sender is in the room and that the target is
            actually their friend, which are the only two limits that matter.
          */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[10px] tracking-[0.25em] text-arena-200 uppercase">
              {t('arena.lobby.players')}
            </h2>
            <button
              type="button"
              onClick={() => setInviting(true)}
              disabled={roomFull}
              title={roomFull ? t('arena.invite.full') : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                roomFull
                  ? 'cursor-not-allowed border-arena-500 text-arena-500'
                  : 'cursor-pointer border-gold/40 text-gold hover:bg-gold/10'
              }`}
            >
              <UserPlusIcon className="h-3.5 w-3.5 shrink-0" />
              {roomFull ? t('arena.invite.full') : t('arena.invite.open')}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {seated.map((player) => {
              const isMe = player.username === username;
              /*
               * The name every other player sees. lobby_state carries a
               * displayName per player, so this is never the current user's
               * name stamped on someone else — but the server falls back to
               * the raw handle when a client joins without sending one, and
               * an older client could send nothing at all. Falling back here
               * too means a missing name shows as a handle rather than as
               * blank space where a player should be.
               */
              const shown = player.displayName?.trim() || player.username;
              return (
                <div
                  key={player.username}
                  className={`bg-arena-800 rounded-sm border p-5 relative ${
                    isMe ? 'border-gold/30' : 'border-white/[0.07]'
                  }`}
                >
                  {player.isHost && (
                    <div className="absolute top-3 right-3 text-[9px] tracking-widest text-gold rounded-sm border border-gold/40 px-2 py-0.5 uppercase">
                      {t('arena.lobby.host')}
                    </div>
                  )}
                  {isMe && !player.isHost && (
                    <div className="absolute top-3 right-3 text-[9px] tracking-widest text-arena-200 rounded-sm border border-arena-400 px-2 py-0.5 uppercase">
                      {t('arena.common.you')}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <Avatar
                      name={shown}
                      username={player.username}
                      avatar={player.avatar}
                      accent={player.isHost}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <div className="text-white font-bold truncate">
                        {shown}
                      </div>
                      <div className="text-flame text-[11px] flex items-center gap-1">
                        <FlameIcon className="h-3 w-3 shrink-0" />
                        {player.streak} streak
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-arena-200 text-[11px]">
                      <span className="text-white font-bold">
                        ${player.money}
                      </span>{' '}
                      {t('arena.lobby.bank')}
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${
                        player.connected
                          ? 'border-gold/40 text-gold'
                          : 'border-arena-400 text-arena-300'
                      }`}
                    >
                      {player.connected && (
                        <CheckIcon className="h-3 w-3 shrink-0" />
                      )}
                      {player.connected
                        ? t('arena.lobby.inRoom')
                        : t('arena.lobby.away')}
                    </div>
                  </div>

                  {/*
                    Host-only, and never on the host's own tile — the same
                    isHost the start button and the leave warning read, so a
                    player who cannot start a match cannot remove someone from
                    it either. The confirm is here because the action is
                    immediate and aimed at a named person.
                  */}
                  {iAmHost && !isMe && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmingKick({
                          username: player.username,
                          name: shown,
                        })
                      }
                      aria-label={t('arena.lobby.removeNamed', { name: shown })}
                      title={t('arena.lobby.removeNamed', { name: shown })}
                      className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-arena-500 py-1.5 text-[10px] tracking-wider text-arena-300 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                    >
                      <XIcon className="h-3 w-3 shrink-0" />
                      {t('arena.lobby.remove')}
                    </button>
                  )}
                </div>
              );
            })}

            {/*
              One placeholder per unoccupied seat: capacity minus the roster.
              emptySlots is 0 when capacity is unknown, so nothing is drawn
              against a guess.
            */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-center rounded-sm border border-white/[0.04] bg-arena-750 p-5"
                aria-label={t('arena.lobby.emptySlot')}
              >
                <div className="text-[11px] tracking-widest text-arena-500 uppercase">
                  {t('arena.lobby.emptySlot')}
                </div>
              </div>
            ))}
          </div>

          {spectators.length > 0 && (
            <div className="mt-4 text-arena-300 text-[11px] tracking-wider uppercase">
              {t('arena.lobby.spectating', {
                n: spectators.length,
                names: spectators.map((s) => s.displayName).join(', '),
              })}
            </div>
          )}

          {/* Host controls */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/*
              Host-only, and not merely disabled for everyone else: a player
              who is not the host has no start control at all. isHost comes off
              the game context — the same value the leave button reads — so the
              two cannot disagree about who is running the room. The server
              enforces it as well; this is the half the player can see.
            */}
            {iAmHost ? (
              <button
                onClick={startGame}
                disabled={!canStart || phase === 'countdown'}
                className={`px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                  canStart && phase !== 'countdown'
                    ? 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
                    : 'cursor-not-allowed bg-arena-700 text-arena-400'
                }`}
              >
                {t('arena.lobby.start')}
              </button>
            ) : (
              <div className="text-[11px] tracking-[0.15em] text-arena-300 uppercase">
                {t('arena.lobby.waitingHost')}
              </div>
            )}
            {/*
              The host leaving deletes the room for everyone, so they are asked
              first. For anyone else leaving is just leaving, and a confirm
              would be friction with nothing behind it.
            */}
            <button
              onClick={() => (iAmHost ? setConfirmingLeave(true) : leaveRoom())}
              className="ml-auto rounded-sm border border-white/10 px-5 py-4 text-[11px] tracking-[0.15em] text-arena-200 uppercase transition-colors hover:bg-arena-700 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.lobby.leave')}
            </button>
            {iAmHost && (
              <button
                onClick={terminateLobby}
                className="rounded-sm border border-white/10 text-arena-200 text-[11px] tracking-[0.15em] uppercase px-5 py-4 hover:bg-arena-700 hover:text-white transition-colors"
              >
                {t('arena.lobby.close')}
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex min-h-0 flex-col rounded-sm border border-white/[0.07] bg-arena-800 xl:w-72">
          <div className="px-4 py-3 border-b border-white/[0.07]">
            <div className="text-[10px] tracking-[0.25em] uppercase text-arena-200">
              {t('arena.lobby.chat')}
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
              placeholder={t('arena.lobby.messagePlaceholder')}
              className="flex-1 bg-arena-750 rounded-sm border border-white/10 text-white text-xs px-3 py-2 outline-none focus:border-gold/30 placeholder:text-arena-400 min-w-0"
            />
            <button
              onClick={send}
              className="bg-arena-600 text-white px-3 py-2 text-xs hover:bg-arena-500 transition-colors"
              aria-label={t('arena.lobby.send')}
            >
              <PaperPlaneIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {confirmingKick && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(0,0,0,0.75)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kick-confirm"
        >
          <div className="flex max-w-md flex-col gap-4 rounded-sm border border-gold/30 bg-arena-800 p-8">
            <p id="kick-confirm" className="text-sm text-arena-100">
              {t('arena.lobby.kickConfirm', { name: confirmingKick.name })}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  kickPlayer(confirmingKick.username);
                  setConfirmingKick(null);
                }}
                className="flex-1 cursor-pointer bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                {t('arena.lobby.remove')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingKick(null)}
                className="cursor-pointer rounded-sm border border-white/20 px-5 py-3 text-[11px] tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                {t('arena.lobby.hostLeaveCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmingLeave && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(0,0,0,0.75)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-warning"
        >
          <div className="flex max-w-md flex-col gap-4 rounded-sm border border-gold/30 bg-arena-800 p-8">
            <div className="text-[11px] tracking-[0.3em] text-gold uppercase">
              {t('arena.lobby.hostLeaveTitle')}
            </div>
            <p id="leave-warning" className="text-sm text-arena-100">
              {t('arena.lobby.hostLeaveWarning')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmingLeave(false);
                  void leaveRoom();
                }}
                className="flex-1 cursor-pointer bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                {t('arena.lobby.hostLeaveConfirm')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingLeave(false)}
                className="cursor-pointer rounded-sm border border-white/20 px-5 py-3 text-[11px] tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                {t('arena.lobby.hostLeaveCancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <InviteFriends
        open={inviting}
        onClose={() => setInviting(false)}
        inRoom={players.map((p) => p.username)}
        sent={inviteSentTo}
        notice={inviteNotice}
      />
    </div>
  );
}
