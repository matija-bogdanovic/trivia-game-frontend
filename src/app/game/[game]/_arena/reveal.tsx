'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';

/** a signed amount, with its sign spelled out */
function Delta({ value }: { value: number }) {
  const positive = value > 0;
  return (
    <span
      className={`tabular-nums ${positive ? 'text-gold' : value < 0 ? 'text-arena-300' : 'text-arena-200'}`}
    >
      {positive ? '+' : value < 0 ? '−' : ''}
      {money(Math.abs(value))}
    </span>
  );
}

/**
 * The reveal, in the arena design's Resolution shape.
 *
 * There is no timer here on purpose. Reveal is a phase the server holds open
 * and then moves on from, and this screen is pure display of the settlement it
 * already sent — so a reload during it needs nothing but the round_result the
 * rejoin replays. Everything shown is a field the server states outright;
 * nothing is recomputed from the roster, which is what kept the old screen
 * disagreeing with the server about who had won what.
 */
export default function ArenaReveal() {
  const { t } = useT();
  const { username } = useGame();
  const {
    players,
    answering,
    lastCorrect,
    timedOut,
    correctAnswer,
    answererDelta,
    betOutcomes,
    eliminatedNow,
    pot,
    minted,
    mintedThisTurn,
  } = useSelector((s: RootState) => s.game);

  const answererName = displayNameOf(players, answering);
  const bets = betOutcomes ?? [];
  const eliminated = eliminatedNow ?? [];

  const headline = lastCorrect
    ? t('arena.game.correct')
    : timedOut
      ? t('arena.game.timeOut')
      : t('arena.game.incorrect');

  return (
    <div className="w-full max-w-2xl text-center">
      <div
        className={`mb-3 text-4xl font-bold tracking-widest sm:text-5xl ${
          lastCorrect ? 'text-gold' : 'text-arena-300'
        }`}
        aria-live="polite"
      >
        {headline}
      </div>

      <p className="mb-8 text-sm text-arena-200">
        {lastCorrect
          ? t('arena.game.answeredCorrectly', { name: answererName })
          : t('arena.game.theCorrectAnswerWas')}
      </p>

      {/* the answer the server states — never inferred from the options */}
      <div
        className={`mb-6 rounded-lg border bg-arena-800 p-6 ${lastCorrect ? 'border-gold/20' : 'border-white/[0.07]'}`}
      >
        <div className="mb-2 text-[10px] tracking-widest text-arena-300 uppercase">
          {t('arena.game.correctAnswer')}
        </div>
        <div className="font-bold text-white">{correctAnswer ?? '—'}</div>
      </div>

      <div
        className={`mb-8 text-4xl font-bold ${answererDelta >= 0 ? 'text-gold' : 'text-arena-300'}`}
      >
        <Delta value={answererDelta} />
      </div>

      {/* ================================================= settled bets */}
      {bets.length > 0 && (
        <div className="mb-6 rounded-lg border border-white/[0.07] bg-arena-800 p-5 text-left">
          <div className="mb-3 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.game.betsSettled')}
          </div>
          <ul className="space-y-2">
            {bets.map((b) => (
              <li
                key={`${b.username}-${b.side}-${b.amount}`}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  b.username === username
                    ? 'border-gold/30 bg-gold/5'
                    : 'border-white/[0.05]'
                }`}
              >
                <Avatar
                  name={displayNameOf(players, b.username)}
                  username={b.username}
                  size="xs"
                  accent={b.won}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-white">
                    {displayNameOf(players, b.username)}
                  </span>
                  <span className="block text-[10px] text-arena-300">
                    {t(
                      b.side === 'correct'
                        ? 'arena.game.betOnCorrect'
                        : 'arena.game.betOnWrong'
                    )}{' '}
                    · {money(b.amount)} × {Number(b.quota ?? 0).toFixed(2)}
                  </span>
                </span>
                <span className="text-right">
                  <span
                    className={`block text-[10px] tracking-widest uppercase ${b.won ? 'text-gold' : 'text-arena-400'}`}
                  >
                    {t(b.won ? 'arena.game.betWon' : 'arena.game.betLost')}
                  </span>
                  <span className="block text-sm font-bold">
                    <Delta value={Number(b.net ?? 0)} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ================================================ pot and minting */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-white/[0.07] bg-arena-800 p-5 sm:grid-cols-3">
        <div>
          <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
            {t('arena.game.pot')}
          </div>
          <div className="font-bold text-white tabular-nums">{money(pot)}</div>
        </div>
        {mintedThisTurn > 0 && (
          <div>
            <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
              {t('arena.game.mintedThisTurn')}
            </div>
            <div className="font-bold text-gold tabular-nums">
              {money(mintedThisTurn)}
            </div>
          </div>
        )}
        {minted > 0 && (
          <div>
            <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
              {t('arena.game.mintedTotal')}
            </div>
            <div className="font-bold text-arena-200 tabular-nums">
              {money(minted)}
            </div>
          </div>
        )}
      </div>

      {eliminated.length > 0 && (
        <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-[11px] tracking-wider text-gold">
          {t('arena.game.eliminated', {
            names: eliminated
              .map((u) => displayNameOf(players, u))
              .filter(Boolean)
              .join(', '),
          })}
        </div>
      )}
    </div>
  );
}
