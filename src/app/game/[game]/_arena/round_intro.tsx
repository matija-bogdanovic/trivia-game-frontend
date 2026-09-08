'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import { useCountdown } from '@/app/components/hooks/game/use_server_clock';
import { useT } from '@/app/lib/i18n';

/**
 * "Runda N" — the two-and-a-half second beat that opens each wheel cycle.
 *
 * A transition card, so it is deliberately almost empty: the round number, how
 * many are still standing, and a bar draining to the spin. Anything more would
 * be unreadable in the time it is on screen.
 *
 * The countdown runs off the remaining-time form of the deadline rather than
 * the absolute one. Both arrive on the same message — that pair is also what
 * teaches the clock its skew — but only the remaining form is immune to a
 * client whose clock is wrong, and a client joining one second into the pause
 * is told 1500ms and lands in step rather than replaying the whole beat.
 */
export default function ArenaRoundIntro() {
  const { t } = useT();
  const { round, playersAlive, introEndsAt, introDurationMs } = useSelector(
    (s: RootState) => s.game
  );
  const { percent } = useCountdown(introEndsAt, introDurationMs);

  return (
    <div className="w-full max-w-lg text-center">
      <div className="mb-4 text-[11px] tracking-[0.4em] text-arena-200 uppercase">
        {t('arena.game.getReady')}
      </div>

      <div
        className="mb-6 text-6xl font-bold tracking-widest text-gold sm:text-7xl"
        aria-live="polite"
      >
        {t('arena.game.round', { n: round })}
      </div>

      {playersAlive > 0 && (
        <div className="mb-8 text-[11px] tracking-[0.25em] text-arena-300 uppercase">
          {t('arena.game.playersAlive', { n: playersAlive })}
        </div>
      )}

      {/* drains into the spin */}
      <div className="h-0.5 w-full overflow-hidden bg-arena-700">
        <div
          className="h-full bg-gold transition-[width] duration-300 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
