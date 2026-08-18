'use client';

import Avatar from '@/app/components/ui/game/avatar';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import {
  clearAchievementNotice,
  clearError,
  displayNameOf,
} from '@/app/redux/slicers/game_slice';
import { AppDispatch, RootState } from '@/app/redux/store';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import GameShell from './_arena/game_shell';
import ArenaQuestion from './_arena/question';
import ArenaRoundIntro from './_arena/round_intro';
import ArenaSpin from './_arena/spin';
import ArenaReveal from './_arena/reveal';
import ArenaBetting from './_arena/betting';
import ArenaPicking from './_arena/picking';
import ArenaDuel from './_arena/duel';
import PasswordPrompt from '@/app/(arena)/_components/password_prompt';
import ArenaLobby from './_arena/lobby';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

function Page() {
  const { t } = useT();
  const { leaveRoom, playAgain, username, joinWithPassword, isHost } =
    useGame();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const {
    phase,
    countdown,
    winner,
    standings,
    totalRounds,
    error,
    achievementNotice,
    kicked,
    terminated,
    players,
    answering,
    turnMode,
    joinDenied,
    roomClosed,
    kickedReason,
    notImplemented,
  } = useSelector((state: RootState) => state.game);

  // achievement toasts dismiss themselves
  React.useEffect(() => {
    if (!achievementNotice) return;
    const id = setTimeout(() => dispatch(clearAchievementNotice()), 6000);
    return () => clearTimeout(id);
  }, [achievementNotice, dispatch]);

  /*
   * The host left and the server deleted the room under everyone. Nobody who
   * stayed can do anything here, so the lobby is torn down rather than left on
   * screen behind the notice — it would be showing a room that no longer
   * exists. The host who triggered it is already navigating away from their
   * own leaveRoom(), so they are not told the host left.
   */
  const closedOnMe = roomClosed !== null && !isHost;

  React.useEffect(() => {
    if (!closedOnMe) return;
    // nobody gets stranded on a dead room if they ignore the button
    const id = setTimeout(() => router.push('/rooms'), 6000);
    return () => clearTimeout(id);
  }, [closedOnMe, router]);

  /*
   * Being kicked ends this player's business with the room the same way, so it
   * leaves the same way. No `leave` is sent: the host already removed them, and
   * telling the server they are leaving a room they are no longer in would at
   * best be a no-op. They are simply routed out.
   */
  React.useEffect(() => {
    if (!kicked) return;
    const id = setTimeout(() => router.push('/rooms'), 6000);
    return () => clearTimeout(id);
  }, [kicked, router]);

  const blocked = kicked || terminated || joinDenied !== null || closedOnMe;
  const inLobby = phase === 'lobby' || phase === 'countdown';

  /*
   * The book is open across the question AND the pause, and closed to the
   * answerer, to a challenge (whose only bet was committed at pick time) and
   * to anyone out of the match. These mirror onPlaceBet's own refusals, which
   * are silent — a panel offered where the server would ignore it is worse
   * than no panel.
   */
  const iAmAnswering = Boolean(username) && answering === username;
  const meNow = players.find((p) => p.username === username);
  const bookOpen =
    (phase === 'question' || phase === 'betting') &&
    turnMode !== 'challenge' &&
    !iAmAnswering &&
    Boolean(meNow?.alive);

  return (
    <>
      {phase === 'connecting' && !blocked && (
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <div className="text-gold text-[11px] tracking-[0.4em] uppercase">
            Connecting
          </div>
          <div className="text-arena-300 text-sm tracking-wider">
            {t('game.connecting')}
          </div>
        </div>
      )}

      {inLobby && !blocked && <ArenaLobby />}

      {/*
       * The arena in-game UI. Question is built; the remaining phases land in
       * the following chunks and fall through to a holding state rather than
       * to the pre-reskin screens, which are being deleted.
       */}
      {!inLobby && phase !== 'connecting' && !blocked && (
        <GameShell
          onLeave={() => void leaveRoom()}
          aside={bookOpen ? <ArenaBetting /> : undefined}
        >
          {phase === 'question' || phase === 'betting' ? (
            <ArenaQuestion />
          ) : phase === 'round_intro' ? (
            <ArenaRoundIntro />
          ) : phase === 'spin' ? (
            <ArenaSpin />
          ) : phase === 'duel' ? (
            <ArenaDuel />
          ) : phase === 'picking' ? (
            <ArenaPicking />
          ) : phase === 'reveal' ? (
            <ArenaReveal />
          ) : (
            <div className="text-center text-[11px] tracking-[0.3em] text-arena-300 uppercase">
              {t('arena.game.phasePending', { phase })}
            </div>
          )}
        </GameShell>
      )}

      {/*
        Two different refusals, kept apart. `unauthenticated` is a session
        problem and offers sign-in; `room_full` is a dead end. Only the
        password cases are a lock, and those now use the same prompt the room
        list and the code entry use, so a private room asks the same way
        wherever you meet it.
      */}
      {joinDenied === 'password_required' || joinDenied === 'wrong_password' ? (
        <PasswordPrompt
          open
          error={
            joinDenied === 'wrong_password'
              ? t('arena.join.wrongPassword')
              : null
          }
          onSubmit={(entered) => joinWithPassword(entered)}
          onCancel={() => void leaveRoom()}
        />
      ) : null}

      {joinDenied &&
        joinDenied !== 'password_required' &&
        joinDenied !== 'wrong_password' &&
        !kicked &&
        !terminated && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(0,0,0,0.75)] p-4">
            <div className="flex w-full max-w-sm flex-col gap-4 border border-white/[0.07] bg-arena-800 p-8">
              {joinDenied === 'unauthenticated' ? (
                <>
                  <div className="text-[11px] tracking-[0.3em] text-gold uppercase">
                    {t('arena.join.signInTitle')}
                  </div>
                  <p className="text-sm text-arena-200">
                    {t('arena.join.signInBody')}
                  </p>
                  <Link
                    href="/login"
                    className="bg-gold px-6 py-3 text-center text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light"
                  >
                    {t('arena.join.goToSignIn')}
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-[11px] tracking-[0.3em] text-gold uppercase">
                    {t('join.roomFullTitle')}
                  </div>
                  <p className="text-sm text-arena-200">{t('join.roomFull')}</p>
                  <button
                    type="button"
                    onClick={() => void leaveRoom()}
                    className="cursor-pointer bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light"
                  >
                    {t('game.leave')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      {closedOnMe && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(0,0,0,0.75)] p-4">
          <div className="flex max-w-md flex-col gap-4 border border-gold/30 bg-arena-800 p-8 text-center">
            <div className="text-[11px] tracking-[0.3em] text-gold uppercase">
              {t('arena.lobby.roomClosedTitle')}
            </div>
            <p className="text-sm text-arena-100">
              {roomClosed === 'host_left'
                ? t('arena.lobby.roomClosedHostLeft')
                : t('arena.lobby.roomClosedGeneric')}
            </p>
            <button
              onClick={() => router.push('/rooms')}
              className="cursor-pointer bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.lobby.backToRooms')}
            </button>
          </div>
        </div>
      )}

      {(kicked || terminated) && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(0,0,0,0.75)] p-4">
          <div className="flex max-w-md flex-col gap-4 border border-white/[0.07] bg-arena-800 p-8 text-center">
            <div className="text-[11px] tracking-[0.3em] text-gold uppercase">
              {kicked
                ? t('arena.lobby.kickedTitle')
                : t('arena.lobby.roomClosedTitle')}
            </div>
            <p className="text-sm text-arena-100">
              {!kicked
                ? t('game.terminatedInfo')
                : kickedReason && kickedReason !== 'host'
                  ? t('arena.lobby.kickedOther')
                  : t('game.kickedInfo')}
            </p>
            <button
              onClick={() => (kicked ? router.push('/rooms') : leaveRoom())}
              className="cursor-pointer bg-gold px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.lobby.backToRooms')}
            </button>
          </div>
        </div>
      )}

      {phase === 'countdown' && countdown !== null && !blocked && (
        <div className="fixed inset-0 z-10 bg-[rgba(6,15,7,0.85)] flex flex-col justify-center items-center gap-4">
          <p className="text-arena-200 text-[11px] tracking-[0.4em] uppercase">
            {t('game.startsIn')}
          </p>
          <span className="text-gold text-8xl font-bold">
            {countdown > 0 ? countdown : 'GO!'}
          </span>
        </div>
      )}

      {phase === 'gameover' && !blocked && (
        <div className="fixed inset-0 z-10 bg-[rgba(6,15,7,0.85)] flex justify-center items-center p-4 overflow-y-auto">
          <div className="flex flex-col gap-4 bg-arena-800 border border-gold/20 p-8 min-w-[320px] max-w-[90vw]">
            <h2 className="text-2xl font-bold text-center text-white tracking-wide">
              {winner
                ? winner === username
                  ? t('game.youWin')
                  : t('game.winner', {
                      name: displayNameOf(standings, winner),
                    })
                : t('game.gameOver')}
            </h2>
            <p className="text-center text-arena-300 text-[11px] tracking-wider uppercase">
              {t('game.questionsAsked', { n: totalRounds })}
            </p>
            <div className="flex flex-col gap-2">
              {standings.map((p, i) => (
                <div
                  key={p.username}
                  className={`flex items-center gap-3 border p-3 ${
                    p.username === username
                      ? 'bg-gold/10 border-gold/30'
                      : 'border-white/[0.07]'
                  }`}
                >
                  <span className="w-6 text-center font-bold text-arena-400">
                    {i + 1}.
                  </span>
                  <Avatar
                    name={p.displayName}
                    username={p.username}
                    avatar={p.avatar}
                    size={32}
                  />
                  <span className="flex-1 truncate text-white text-sm font-bold">
                    {p.displayName}
                    {p.username === username && (
                      <span className="text-[9px] tracking-widest text-arena-300 border border-arena-400 px-1.5 ml-2">
                        {t('game.you')}
                      </span>
                    )}
                  </span>
                  <span className="text-gold font-bold">${p.money}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={playAgain}
                className="bg-gold text-arena-950 font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors"
              >
                {t('game.playAgain')}
              </button>
              <button
                className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-5 py-3 hover:bg-arena-700 transition-colors"
                onClick={leaveRoom}
              >
                {t('game.leave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {achievementNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20 bg-gold text-arena-950 font-bold text-[11px] tracking-wider px-4 py-2 max-w-[90vw]">
          {t('game.achUnlocked', {
            name: displayNameOf(players, achievementNotice.username),
            items: achievementNotice.ids
              .map((id, i) => {
                const translated = t(`ach.${id}`);
                return translated === `ach.${id}`
                  ? achievementNotice.names[i]
                  : translated;
              })
              .join(', '),
          })}
        </div>
      )}

      {notImplemented && !blocked && (
        <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 border border-gold/40 bg-arena-800 px-4 py-3 text-sm text-white">
          <span>{t('game.notImplemented')}</span>
          <button
            className="cursor-pointer font-bold text-gold"
            onClick={() => dispatch(clearError())}
            aria-label={t('game.ok')}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 bg-arena-800 border border-gold/40 text-white text-sm px-4 py-3 flex items-center gap-3">
          <span>{error}</span>
          <button
            className="font-bold cursor-pointer text-gold"
            onClick={() => dispatch(clearError())}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default Page;
