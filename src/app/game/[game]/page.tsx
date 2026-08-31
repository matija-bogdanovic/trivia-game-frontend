'use client';

import { useGame } from '@/app/components/hooks/game/context/game_context';
import { clearError } from '@/app/redux/slicers/game_slice';
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
import ArenaResults from './_arena/results';
import { rankPlayers, moneyChange } from './_arena/standings';
import { money } from '@/app/(arena)/_lib/money';
import PasswordPrompt from '@/app/(arena)/_components/password_prompt';
import ArenaLobby from './_arena/lobby';
import AchievementToasts from './_arena/achievement_toasts';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

function Page() {
  const { t } = useT();
  const { leaveRoom, username, joinWithPassword, isHost } = useGame();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const {
    phase,
    countdown,
    error,
    kicked,
    terminated,
    players,
    startingMoney,
    answering,
    turnMode,
    joinDenied,
    roomClosed,
    kickedReason,
    notImplemented,
    spectating,
  } = useSelector((state: RootState) => state.game);

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

  /**
   * Watching rather than playing.
   *
   * Two sources, either sufficient. The server says so once on the join
   * resync — the only message that can answer it per viewer — and the roster
   * says so continuously: a match is running and I am not in it. The derived
   * half is what keeps this right after a broadcast replaces `players`, and
   * what makes the screen correct even against a server that does not send
   * the flag at all.
   *
   * Deliberately false during `gameover`: the match is over, the results are
   * for everyone, and there is nothing left to be excluded from.
   */
  const inMatch =
    !inLobby && phase !== 'connecting' && phase !== 'gameover' && !blocked;
  const iAmSpectator = inMatch && (spectating || (Boolean(username) && !meNow));

  const bookOpen =
    (phase === 'question' || phase === 'betting') &&
    turnMode !== 'challenge' &&
    !iAmAnswering &&
    !iAmSpectator &&
    Boolean(meNow?.alive);

  return (
    <>
      {/*
        Outside every phase branch on purpose: an unlock arrives with the
        wallet write at the end of a match, so the toast has to outlive the
        phase that earned it. It is fixed-position and click-through, so it
        costs the layout nothing wherever it is mounted.
      */}
      <AchievementToasts />

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
          spectating={iAmSpectator}
          aside={bookOpen ? <ArenaBetting /> : undefined}
        >
          {phase === 'question' || phase === 'betting' ? (
            <ArenaQuestion />
          ) : phase === 'round_intro' ? (
            <ArenaRoundIntro />
          ) : phase === 'spin' ? (
            <ArenaSpin />
          ) : phase === 'gameover' ? (
            <ArenaResults
              rankings={rankPlayers(players).map((p) => ({
                name: p.displayName || p.username,
                initial: (p.displayName || p.username || '?')
                  .charAt(0)
                  .toUpperCase(),
                money: p.money ?? 0,
                change: moneyChange(p.money ?? 0, startingMoney),
                correct: Number(p.stats?.correct ?? 0),
                wrong: Number(p.stats?.wrong ?? 0),
                betsWon: Number(p.stats?.betsWon ?? 0),
                streak: p.streak ?? 0,
                isYou: p.username === username,
              }))}
              yourPerformance={(() => {
                const me = players.find((p) => p.username === username);
                if (!me) return [];
                return [
                  {
                    labelKey: 'arena.stat.correct',
                    value: String(me.stats?.correct ?? 0),
                  },
                  {
                    labelKey: 'arena.stat.wrong',
                    value: String(me.stats?.wrong ?? 0),
                  },
                  {
                    labelKey: 'arena.stat.betsWon',
                    value: String(me.stats?.betsWon ?? 0),
                  },
                  {
                    labelKey: 'arena.stat.balance',
                    value: money(me.money ?? 0),
                  },
                ];
              })()}
            />
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
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-sm border border-white/[0.07] bg-arena-800 p-8">
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
          <div className="flex max-w-md flex-col gap-4 rounded-sm border border-gold/30 bg-arena-800 p-8 text-center">
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
          <div className="flex max-w-md flex-col gap-4 rounded-sm border border-white/[0.07] bg-arena-800 p-8 text-center">
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

      {notImplemented && !blocked && (
        <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-sm border border-gold/40 bg-arena-800 px-4 py-3 text-sm text-white">
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 bg-arena-800 rounded-sm border border-gold/40 text-white text-sm px-4 py-3 flex items-center gap-3">
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
