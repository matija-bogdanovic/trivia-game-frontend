'use client';

import Avatar from '@/app/components/ui/game/avatar';
import QuestionUI from '@/app/components/ui/game/question_ui';
import SpinWheel from '@/app/components/ui/game/spin_wheel';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import {
  clearAchievementNotice,
  clearError,
  displayNameOf,
} from '@/app/redux/slicers/game_slice';
import { AppDispatch, RootState } from '@/app/redux/store';
import React from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import SideBar from './side_bar';
import LeaveButton from './leave_button';
import ArenaLobby from './_arena/lobby';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

function Page() {
  const { t } = useT();
  const { leaveRoom, playAgain, username, joinWithPassword } = useGame();
  const dispatch = useDispatch<AppDispatch>();
  const [roomPassword, setRoomPassword] = React.useState('');
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
    joinDenied,
  } = useSelector((state: RootState) => state.game);

  // achievement toasts dismiss themselves
  React.useEffect(() => {
    if (!achievementNotice) return;
    const id = setTimeout(() => dispatch(clearAchievementNotice()), 6000);
    return () => clearTimeout(id);
  }, [achievementNotice, dispatch]);

  const blocked = kicked || terminated || joinDenied !== null;
  const inLobby = phase === 'lobby' || phase === 'countdown';

  return (
    <>
      {phase === 'connecting' && !blocked && (
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <div className="text-gold text-[11px] tracking-[0.4em] uppercase">
            Connecting
          </div>
          <div className="text-g300 text-sm tracking-wider">
            {t('game.connecting')}
          </div>
        </div>
      )}

      {inLobby && !blocked && <ArenaLobby />}

      {/*
       * Play phases still render the pre-reskin UI; the arena LiveGame lands
       * in the last commit of this tier.
       */}
      {!inLobby && phase !== 'connecting' && !blocked && (
        <div className="p-4 grid grid-cols-[0.3fr_1fr] grid-rows-1 w-full gap-4 h-full">
          <SideBar />
          <QuestionUI />
          <LeaveButton />
        </div>
      )}

      {joinDenied && !kicked && !terminated && (
        <div className="fixed inset-0 z-30 bg-[rgba(0,0,0,0.75)] flex justify-center items-center p-4">
          <form
            className="flex flex-col gap-4 bg-g800 border border-white/[0.07] p-8 max-w-sm w-full"
            onSubmit={(e) => {
              e.preventDefault();
              if (roomPassword) joinWithPassword(roomPassword);
            }}
          >
            {joinDenied === 'unauthenticated' ? (
              <>
                <div className="text-gold text-[11px] tracking-[0.3em] uppercase">
                  Sign in to play
                </div>
                <p className="text-g200 text-sm">
                  Your session expired or was never started. Sign in and open
                  the room again.
                </p>
                <Link
                  href="/login"
                  className="bg-gold text-g950 font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors text-center"
                >
                  GO TO SIGN IN
                </Link>
              </>
            ) : joinDenied === 'room_full' ? (
              <>
                <div className="text-gold text-[11px] tracking-[0.3em] uppercase">
                  {t('join.roomFullTitle')}
                </div>
                <p className="text-g200 text-sm">{t('join.roomFull')}</p>
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="bg-gold text-g950 font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors"
                >
                  {t('game.leave')}
                </button>
              </>
            ) : (
              <>
                <div className="text-gold text-[11px] tracking-[0.3em] uppercase">
                  🔒 {t('game.passwordTitle')}
                </div>
                {joinDenied === 'wrong_password' && (
                  <p className="text-g100 text-sm">{t('join.wrongPassword')}</p>
                )}
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder={t('create.passwordPlaceholder')}
                  className="bg-g750 border border-white/10 text-white text-sm px-4 py-3 outline-none focus:border-gold/40 placeholder:text-g400"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!roomPassword}
                    className={`flex-1 font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-3 transition-colors ${
                      roomPassword
                        ? 'bg-gold text-g950 hover:bg-gold-light'
                        : 'bg-g700 text-g400 cursor-not-allowed'
                    }`}
                  >
                    {t('game.enterRoom')}
                  </button>
                  <button
                    type="button"
                    className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-5 py-3 hover:bg-g700 transition-colors"
                    onClick={leaveRoom}
                  >
                    {t('game.leave')}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {(kicked || terminated) && (
        <div className="fixed inset-0 z-30 bg-[rgba(0,0,0,0.75)] flex justify-center items-center p-4">
          <div className="flex flex-col gap-4 bg-g800 border border-white/[0.07] p-8 max-w-md text-center">
            <p className="text-g100 text-sm">
              {kicked ? t('game.kickedInfo') : t('game.terminatedInfo')}
            </p>
            <button
              onClick={leaveRoom}
              className="bg-gold text-g950 font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors"
            >
              {t('game.ok')}
            </button>
          </div>
        </div>
      )}

      {phase === 'spin' && !blocked && <SpinWheel />}

      {phase === 'countdown' && countdown !== null && !blocked && (
        <div className="fixed inset-0 z-10 bg-[rgba(6,15,7,0.85)] flex flex-col justify-center items-center gap-4">
          <p className="text-g200 text-[11px] tracking-[0.4em] uppercase">
            {t('game.startsIn')}
          </p>
          <span className="text-gold text-8xl font-bold">
            {countdown > 0 ? countdown : 'GO!'}
          </span>
        </div>
      )}

      {phase === 'gameover' && !blocked && (
        <div className="fixed inset-0 z-10 bg-[rgba(6,15,7,0.85)] flex justify-center items-center p-4 overflow-y-auto">
          <div className="flex flex-col gap-4 bg-g800 border border-gold/20 p-8 min-w-[320px] max-w-[90vw]">
            <h2 className="text-2xl font-bold text-center text-white tracking-wide">
              {winner
                ? winner === username
                  ? t('game.youWin')
                  : t('game.winner', {
                      name: displayNameOf(standings, winner),
                    })
                : t('game.gameOver')}
            </h2>
            <p className="text-center text-g300 text-[11px] tracking-wider uppercase">
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
                  <span className="w-6 text-center font-bold text-g400">
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
                      <span className="text-[9px] tracking-widest text-g300 border border-g400 px-1.5 ml-2">
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
                className="bg-gold text-g950 font-bold text-[11px] tracking-[0.2em] uppercase px-6 py-3 hover:bg-gold-light transition-colors"
              >
                {t('game.playAgain')}
              </button>
              <button
                className="border border-white/20 text-white text-[11px] tracking-[0.15em] uppercase px-5 py-3 hover:bg-g700 transition-colors"
                onClick={leaveRoom}
              >
                {t('game.leave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {achievementNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20 bg-gold text-g950 font-bold text-[11px] tracking-wider px-4 py-2 max-w-[90vw]">
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

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 bg-g800 border border-gold/40 text-white text-sm px-4 py-3 flex items-center gap-3">
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
