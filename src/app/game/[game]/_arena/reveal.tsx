'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';
import ArenaDuelResult from './duel_result';

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
    duelSubmissions,
  } = useSelector((s: RootState) => s.game);

  /*
    A duel resolves into the same `reveal` phase as a wheel question, but it
    settles nothing this screen reads — no answerer, no correctness, no book.
    Rendering it here showed the PREVIOUS turn's verdict above the duel's
    ante. `duelSubmissions` is the server's own per-racer record and is
    written only by duel_result, so it is exactly the discriminator.
  */
  if ((duelSubmissions ?? []).length > 0) return <ArenaDuelResult />;

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
      {/*
        As many columns as there are figures, centred.

        This was a fixed grid-cols-2 sm:grid-cols-3, and two of the three cells
        are conditional — nothing is minted most turns. So the usual case was
        one figure sitting in the left third of a three-column grid, with the
        pot pressed against the edge of a wide panel.

        Built as a list first so the count is a real number rather than
        something to keep in step with three separate conditionals; the same
        literal-class lookup the wheel uses, for the same reason Tailwind
        cannot see a computed one.
      */}
      {(() => {
        const figures = [
          {
            label: t('arena.game.pot'),
            value: money(pot),
            tone: 'text-white',
          },
          ...(mintedThisTurn > 0
            ? [
                {
                  label: t('arena.game.mintedThisTurn'),
                  value: money(mintedThisTurn),
                  tone: 'text-gold',
                },
              ]
            : []),
          ...(minted > 0
            ? [
                {
                  label: t('arena.game.mintedTotal'),
                  value: money(minted),
                  tone: 'text-arena-200',
                },
              ]
            : []),
        ];
        return (
          <div className="mb-6 rounded-lg border border-white/[0.07] bg-arena-800 p-5">
            {/*
              A WRAPPING ROW, not a grid with a column count.

              The count-driven grid this replaced was centred but `w-fit`,
              so three figures laid out at their natural width — and
              "DODATO OVE RUNDE" is sixteen uppercase characters. Three of
              those plus the gaps come to roughly 416px, against the ~287px
              a 375px phone has left after the stage and panel padding. It
              pushed the page sideways on exactly the turn that mints,
              which is the turn worth reading.

              Wrapping needs no count at all: one, two or three figures
              centre themselves at any width, and the third drops to its
              own line when there is no room rather than off the screen.
            */}
            <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-4 text-center">
              {figures.map((f) => (
                <div key={f.label}>
                  <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                    {f.label}
                  </div>
                  <div className={`font-bold tabular-nums ${f.tone}`}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
