'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';

/**
 * Seconds, to hundredths.
 *
 * Two decimals because a duel is regularly decided inside a tenth of a second
 * and a whole-second reading would show the two racers tying when one of them
 * plainly won. The number itself is the SERVER's — measured from the instant
 * the question went up to the instant the submission landed — so it is the
 * same clock that decided the race, not a re-measurement here that could
 * disagree with the result printed beside it.
 */
function toSeconds(atMs: number | null): string | null {
  if (typeof atMs !== 'number' || !Number.isFinite(atMs)) return null;
  return (Math.max(0, atMs) / 1000).toFixed(2);
}

/**
 * The duel's resolution: two racers, two times, one winner.
 *
 * Until now a duel reached the ordinary reveal screen, which reads `answering`
 * and `lastCorrect` — fields a duel never sets — so it showed the PREVIOUS
 * wheel question's verdict over the duel's ante. This is the screen the race
 * actually earns, and every figure on it is one the server stated.
 */
export default function ArenaDuelResult() {
  const { t } = useT();
  const { username } = useGame();
  const {
    players,
    duelPlayers,
    duelSubmissions,
    duelWinner,
    duelAnte,
    duelPayout,
    correctAnswer,
    eliminatedNow,
    pot,
  } = useSelector((s: RootState) => s.game);

  const racers = duelPlayers ?? [];
  const subs = duelSubmissions ?? [];
  const submissionFor = (u: string) => subs.find((s) => s.username === u);

  /** the finishing order: correct answers by time, everyone else after */
  const ranked = [...racers].sort((a, b) => {
    const x = submissionFor(a);
    const y = submissionFor(b);
    if (Boolean(x?.correct) !== Boolean(y?.correct)) return x?.correct ? -1 : 1;
    return (x?.atMs ?? Infinity) - (y?.atMs ?? Infinity);
  });

  const winnerName = displayNameOf(players, duelWinner);
  const loser = racers.find((u) => u !== duelWinner) ?? null;
  const winnerTime = toSeconds(submissionFor(duelWinner ?? '')?.atMs ?? null);
  const loserSub = loser ? submissionFor(loser) : undefined;
  const loserTime = toSeconds(loserSub?.atMs ?? null);

  /*
    The sentence Matija asked for, in the two shapes the race can end in:
    both answered, so there is a margin to state — or only one did, and
    saying the other "needed" a time would be inventing one.
  */
  const story =
    duelWinner && winnerTime
      ? loser && loserTime
        ? t('arena.duel.beat', {
            winner: winnerName,
            fast: winnerTime,
            loser: displayNameOf(players, loser),
            slow: loserTime,
          })
        : loser
          ? t('arena.duel.wonAlone', {
              winner: winnerName,
              fast: winnerTime,
              loser: displayNameOf(players, loser),
            })
          : null
      : null;

  const eliminated = eliminatedNow ?? [];

  return (
    <div className="w-full max-w-2xl text-center">
      <div className="mb-2 text-[10px] tracking-[0.4em] text-gold uppercase">
        {t('arena.duel.result')}
      </div>
      <div
        className={`mb-3 text-3xl font-bold tracking-widest sm:text-4xl ${
          duelWinner ? 'text-gold' : 'text-arena-300'
        }`}
        aria-live="polite"
      >
        {duelWinner
          ? t('arena.duel.won', { name: winnerName })
          : t('arena.duel.nobody')}
      </div>

      {story && <p className="mb-8 text-sm text-arena-200">{story}</p>}

      {/* the answer the server states — never inferred from the options */}
      <div className="mb-6 rounded-lg border border-white/[0.07] bg-arena-800 p-6">
        <div className="mb-2 text-[10px] tracking-widest text-arena-300 uppercase">
          {t('arena.game.correctAnswer')}
        </div>
        <div className="font-bold text-white">{correctAnswer ?? '—'}</div>
      </div>

      {/* =========================================== the race, in order */}
      <div className="mb-6 rounded-lg border border-white/[0.07] bg-arena-800 p-5">
        <div className="mb-4 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          {t('arena.duel.raceTimes')}
        </div>
        <ul className="space-y-3">
          {ranked.map((u, i) => {
            const p = players.find((x) => x.username === u);
            const sub = submissionFor(u);
            const secs = toSeconds(sub?.atMs ?? null);
            const isWinner = u === duelWinner;
            return (
              <li
                key={u}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left ${
                  isWinner
                    ? 'border-gold/40 bg-gold/[0.06]'
                    : 'border-white/[0.07]'
                }`}
              >
                <Avatar
                  name={p?.displayName ?? u}
                  username={u}
                  avatar={p?.avatar}
                  accent={isWinner}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white">
                    {p?.displayName ?? u}
                    {u === username && (
                      <span className="ml-2 text-[10px] tracking-wider text-arena-300 uppercase">
                        {t('arena.common.you')}
                      </span>
                    )}
                  </div>
                  {/*
                    Why the time is what it is. A wrong answer still has a
                    time — it was a real buzz — so the state has to be said
                    separately rather than read off the clock.
                  */}
                  <div className="text-[10px] tracking-wider text-arena-300 uppercase">
                    {!sub?.answered
                      ? t('arena.duel.noAnswer')
                      : sub.correct
                        ? i === 0 && isWinner
                          ? t('arena.duel.faster')
                          : t('arena.game.correct')
                        : t('arena.duel.wrong')}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-lg font-bold tabular-nums ${
                    isWinner ? 'text-gold' : 'text-arena-200'
                  }`}
                >
                  {secs !== null ? t('arena.duel.seconds', { n: secs }) : '—'}
                </div>
              </li>
            );
          })}
        </ul>
        {ranked.length === 0 && (
          <p className="text-[11px] tracking-wider text-arena-300 uppercase">
            {t('arena.duel.noRacers')}
          </p>
        )}
      </div>

      {/* what the race cost and paid */}
      {duelAnte > 0 && (
        <p className="mb-6 text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.duel.stake', {
            amount: money(duelAnte),
            payout: money(duelPayout),
          })}
        </p>
      )}

      <div className="mb-6 rounded-lg border border-white/[0.07] bg-arena-800 p-5">
        <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
          {t('arena.game.pot')}
        </div>
        <div className="font-bold text-gold tabular-nums">{money(pot)}</div>
      </div>

      {eliminated.length > 0 && (
        <p className="text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.game.eliminated', {
            names: eliminated.map((u) => displayNameOf(players, u)).join(', '),
          })}
        </p>
      )}
    </div>
  );
}
