'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import LogoPlaceholder from '@/app/(arena)/_components/logo_placeholder';
import { money } from '@/app/(arena)/_lib/money';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';

/**
 * The frame every play phase sits in: top bar, players rail, bottom HUD.
 *
 * Ported from the Angular live-game design. The three surrounds are here
 * rather than in each phase because they do not change between phases — only
 * the stage does — and duplicating them was how the pre-reskin screens drifted
 * apart from each other.
 *
 * Everything reads from game_state: the rail is the server's roster with its
 * money and streaks, the pot is the server's pot. Nothing is derived from a
 * phase message, so a reload that lands mid-phase still draws the whole frame.
 */

/** the four rungs of the difficulty ladder, lit as the chain deepens */
const LADDER = ['I', 'II', 'III', 'IV'];

export default function GameShell({
  children,
  aside,
  onLeave,
  spectating = false,
}: {
  children: React.ReactNode;
  /** the bet panel, when the book is open — it spans two phases, so it
   *  sits beside the stage rather than replacing it */
  aside?: React.ReactNode;
  onLeave: () => void;
  /** watching, not playing: the frame says so and offers nothing to press */
  spectating?: boolean;
}) {
  const { t } = useT();
  const { username } = useGame();
  const { players, pot, round, difficulty, answering, phase, startingMoney } =
    useSelector((s: RootState) => s.game);

  const iAmAnswering = Boolean(username) && answering === username;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ========================================================= top bar */}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-white/[0.07] bg-arena-950 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <div className="h-7">
            <LogoPlaceholder />
          </div>
          <ol className="hidden items-center gap-1.5 md:flex">
            {LADDER.map((label, i) => (
              <li
                key={label}
                className={`border px-2 py-1 text-[9px] tracking-widest uppercase transition-colors duration-300 ${
                  i < difficulty
                    ? 'border-gold/50 bg-gold/10 text-gold'
                    : 'border-arena-500 text-arena-500'
                }`}
              >
                {label}
              </li>
            ))}
          </ol>
        </div>

        <div className="text-center">
          <div className="text-[9px] tracking-widest text-arena-300 uppercase">
            {t('arena.game.pot')}
          </div>
          <div
            className="text-2xl font-bold text-gold tabular-nums"
            aria-live="polite"
          >
            {money(pot)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* said once, where the frame is, rather than on every phase card */}
          {spectating && (
            <div
              className="border border-gold/40 bg-gold/10 px-2.5 py-1 text-[9px] font-bold tracking-[0.2em] text-gold uppercase"
              role="status"
            >
              {t('arena.game.spectatingBadge')}
            </div>
          )}
          <div className="hidden text-xs text-arena-200 sm:block">
            {t('arena.game.round', { n: round })}
          </div>
          <button
            type="button"
            onClick={onLeave}
            className="cursor-pointer border border-arena-500 px-3 py-1.5 text-[10px] tracking-wider text-arena-300 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.lobby.leave')}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* ================================================= players rail */}
        <aside className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/[0.07] bg-arena-950 p-3 lg:w-52 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:border-r lg:border-b-0">
          <div className="hidden px-1 pb-1 text-[9px] tracking-widest text-arena-300 uppercase lg:block">
            {t('arena.lobby.players')}
          </div>

          {/*
            Competitors only. A spectator has no money and cannot be picked,
            so listing them beside the players would put a zero balance in a
            column that means something else. lobby_state marks them; the
            running match simply never contains them.
          */}
          {players
            .filter((p) => !p.isSpectator)
            .map((p) => {
              const isMe = p.username === username;
              const isAnswering = p.username === answering;
              return (
                <div
                  key={p.username}
                  className={`min-w-[9.5rem] border p-3 transition-colors duration-150 lg:min-w-0 ${
                    isAnswering
                      ? 'border-gold/50 bg-gold/10'
                      : 'border-white/[0.07] bg-arena-800'
                  } ${isMe ? 'border-l-2 border-l-gold' : ''} ${
                    p.alive ? '' : 'opacity-40'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar
                      name={p.displayName}
                      username={p.username}
                      avatar={p.avatar}
                      accent={isAnswering}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-bold text-white">
                        {isMe ? t('arena.common.you') : p.displayName}
                      </div>
                      {p.streak > 0 && (
                        <div className="text-[9px] text-gold">
                          🔥 {p.streak}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gold tabular-nums">
                    {money(p.money)}
                  </div>
                </div>
              );
            })}
        </aside>

        {/* =========================================================== stage */}
        <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 sm:p-8">
          {children}
        </main>

        {aside}
      </div>

      {/* ====================================================== bottom HUD */}
      <footer className="flex items-center justify-between gap-4 border-t border-white/[0.07] bg-arena-950 px-4 py-2 sm:px-6">
        <div className="text-[10px] tracking-widest text-arena-300 uppercase">
          {t('arena.game.round', { n: round })}
        </div>
        <div className="text-center" aria-live="polite">
          {spectating ? (
            <span className="text-[10px] tracking-wider text-arena-300 uppercase">
              {t('arena.game.spectatingHint')}
            </span>
          ) : (
            phase === 'question' &&
            iAmAnswering && (
              <span className="animate-pulse text-[10px] font-bold tracking-wider text-gold uppercase">
                {t('arena.game.yourTurn')}
              </span>
            )
          )}
        </div>
        <div className="hidden text-[10px] tracking-widest text-arena-300 uppercase sm:block">
          {t('arena.game.hudPlayers', {
            n: players.length,
            money: money(startingMoney),
          })}
        </div>
      </footer>
    </div>
  );
}
