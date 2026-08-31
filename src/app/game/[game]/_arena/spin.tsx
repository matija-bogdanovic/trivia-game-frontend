'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { useServerClock } from '@/app/components/hooks/game/use_server_clock';
import { displayNameOf } from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';
import { spinIndexAt } from './spin_index';

/** the highlight moves faster than the 250ms match clock */
const FRAME_MS = 60;

/**
 * Player selection, in the arena design: a grid of tiles with the highlight
 * cycling across them and settling on whoever the wheel picked. Not a wheel —
 * the design does not have one.
 *
 * Driven entirely from currentSpin on game_state. startedAt and endsAt are
 * absolute SERVER times, and they are the one pair in the protocol with no
 * remaining-time twin to derive them from, which is the reason useServerClock
 * tracks skew at all: without correcting them a client whose clock is a minute
 * fast would render the spin as already over.
 *
 * Because the position is a function of the clock rather than an accumulating
 * animation, reloading mid-spin needs no special handling. The new page asks
 * the same question of the same numbers and gets the same answer.
 */
export default function ArenaSpin() {
  const { t } = useT();
  const { toClient } = useServerClock();
  const { players, currentSpin, spinTarget } = useSelector(
    (s: RootState) => s.game
  );

  // its own frame clock: the highlight should flick, not tick
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), FRAME_MS);
    return () => clearInterval(id);
  }, []);

  const seated = players.filter((p) => !p.isSpectator);
  // currentSpin is the durable record; the thin spin message is the fallback
  const target = currentSpin?.target ?? spinTarget ?? null;
  const targetIndex = seated.findIndex((p) => p.username === target);

  const startedAt = currentSpin ? toClient(currentSpin.startedAt) : null;
  const endsAt = currentSpin ? toClient(currentSpin.endsAt) : null;

  const spinning =
    startedAt !== null && endsAt !== null && now < endsAt && targetIndex >= 0;

  const highlight =
    startedAt !== null && endsAt !== null
      ? spinIndexAt({
          now,
          startedAt,
          endsAt,
          targetIndex,
          playerCount: seated.length,
        })
      : targetIndex;

  const targetName = displayNameOf(players, target);

  return (
    <div className="w-full max-w-lg text-center">
      <div className="mb-8 text-[11px] tracking-[0.3em] text-arena-200 uppercase">
        {t('arena.game.playerSelection')}
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {seated.map((p, i) => {
          const lit = i === highlight;
          return (
            <div
              key={p.username}
              className={`flex flex-col items-center rounded-sm border p-4 transition-all duration-100 ${
                lit
                  ? 'scale-110 border-gold bg-gold/15 shadow-[0_0_24px_-6px] shadow-gold/50'
                  : 'scale-100 border-white/[0.07] bg-arena-800'
              }`}
            >
              <div className="mb-2">
                <Avatar
                  name={p.displayName}
                  username={p.username}
                  avatar={p.avatar}
                  accent={lit}
                  size="lg"
                />
              </div>
              <div
                className={`text-[11px] font-bold ${lit ? 'text-gold' : 'text-arena-200'}`}
              >
                {p.displayName}
              </div>
              <div className="mt-0.5 text-[10px] text-arena-300 tabular-nums">
                {money(p.money)}
              </div>
            </div>
          );
        })}
      </div>

      {seated.length === 0 && (
        <p className="text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.game.noPlayers')}
        </p>
      )}

      {spinning ? (
        <div
          className="animate-pulse text-lg font-bold tracking-widest text-gold"
          aria-live="polite"
        >
          {t('arena.game.selecting')}
        </div>
      ) : (
        targetIndex >= 0 && (
          <div
            className="text-lg font-bold tracking-widest text-gold"
            aria-live="polite"
          >
            {t('arena.game.selected', { name: targetName })}
          </div>
        )
      )}
    </div>
  );
}
