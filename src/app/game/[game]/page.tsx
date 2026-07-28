'use client';

import Button from '@/app/components/general/button';
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
import { useDispatch, useSelector } from 'react-redux';
import SideBar from './side_bar';
import StartButton from './start_button';
import LeaveButton from './leave_button';
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

  return (
    <div className="p-4 grid grid-cols-[0.3fr_1fr] grid-rows-1 w-full gap-4 h-[100vh]">
      <SideBar />
      <QuestionUI />
      <LeaveButton />
      <StartButton />

      {joinDenied && !kicked && !terminated && (
        <div className="fixed inset-0 z-30 bg-[rgba(0,0,0,0.6)] flex justify-center items-center">
          <form
            className="flex flex-col gap-4 bg-white rounded-md p-6 max-w-sm w-full"
            onSubmit={(e) => {
              e.preventDefault();
              if (roomPassword) joinWithPassword(roomPassword);
            }}
          >
            <h3 className="font-semibold text-lg">
              🔒 {t('game.passwordTitle')}
            </h3>
            {joinDenied === 'wrong_password' && (
              <p className="text-red-500">{t('join.wrongPassword')}</p>
            )}
            <input
              type="password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder={t('create.passwordPlaceholder')}
              className="border border-gray-300 rounded px-3 py-2"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded border border-gray-300 cursor-pointer"
                onClick={leaveRoom}
              >
                {t('game.leave')}
              </button>
              <Button
                text={t('game.enterRoom')}
                type="submit"
                disabled={!roomPassword}
              />
            </div>
          </form>
        </div>
      )}

      {(kicked || terminated) && (
        <div className="fixed inset-0 z-30 bg-[rgba(0,0,0,0.6)] flex justify-center items-center">
          <div className="flex flex-col gap-4 bg-white rounded-md p-6 max-w-md text-center">
            <p>{kicked ? t('game.kickedInfo') : t('game.terminatedInfo')}</p>
            <Button text={t('game.ok')} onClick={leaveRoom} />
          </div>
        </div>
      )}

      {phase === 'spin' && !kicked && !terminated && <SpinWheel />}

      {phase === 'countdown' && countdown !== null && (
        <div className="fixed inset-0 z-10 bg-[rgba(0,0,0,0.5)] flex flex-col justify-center items-center gap-4">
          <p className="text-white text-xl">{t('game.startsIn')}</p>
          <span className="text-white text-7xl font-bold">
            {countdown > 0 ? countdown : 'GO!'}
          </span>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="fixed inset-0 z-10 bg-[rgba(0,0,0,0.5)] flex justify-center items-center">
          <div className="flex flex-col gap-4 bg-white rounded-md p-6 min-w-[320px] max-w-[90vw]">
            <h2 className="text-2xl font-bold text-center">
              {winner
                ? winner === username
                  ? t('game.youWin')
                  : t('game.winner', {
                      name: displayNameOf(standings, winner),
                    })
                : t('game.gameOver')}
            </h2>
            <p className="text-center text-gray-500">
              {t('game.questionsAsked', { n: totalRounds })}
            </p>
            <div className="flex flex-col gap-2">
              {standings.map((p, i) => (
                <div
                  key={p.username}
                  className="flex items-center gap-3 border rounded p-2"
                >
                  <span className="w-6 text-center font-semibold">
                    {i + 1}.
                  </span>
                  <Avatar
                    name={p.displayName}
                    username={p.username}
                    avatar={p.avatar}
                    size={32}
                  />
                  <span className="flex-1 truncate">
                    {p.displayName}
                    {p.username === username && (
                      <span className="text-sm text-gray-500">
                        {' '}
                        {t('game.you')}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-600">${p.money}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Button text={t('game.playAgain')} onClick={playAgain} />
              <button
                className="px-4 py-2 rounded border border-gray-300 cursor-pointer"
                onClick={leaveRoom}
              >
                {t('game.leave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {achievementNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-white px-4 py-2 rounded shadow max-w-[90vw]">
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white px-4 py-2 rounded shadow flex items-center gap-3">
          <span>{error}</span>
          <button
            className="font-bold cursor-pointer"
            onClick={() => dispatch(clearError())}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default Page;
