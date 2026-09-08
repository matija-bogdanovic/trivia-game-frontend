'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';

/** how often the countdowns re-read the clock */
const TICK_MS = 250;

/**
 * The match clock, on the client's own wall time.
 *
 * The server states a deadline two different ways and only one of them is safe
 * to use directly. Every phase message carries time REMAINING, which a skewed
 * client clock cannot corrupt — the slice turns those into client-time
 * deadlines the moment they arrive, so a timer built from them is right even on
 * a machine whose clock is minutes out. game_state carries the same deadline as
 * an ABSOLUTE server timestamp, which on that same machine would be minutes
 * wrong.
 *
 * Most of the time the remaining-time form is available and is what should be
 * used. `toClient` exists for the one field that has no such twin —
 * currentSpin.startedAt, which the spin animation needs in order to know how
 * far through the spin it already is after a reload.
 */
export function useServerClock() {
  const skewMs = useSelector((s: RootState) => s.game.serverSkewMs);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return {
    /** client wall time, re-read every tick */
    now,
    skewMs,
    /** place an absolute SERVER timestamp on the client's clock */
    toClient: (serverTimestamp: number) => serverTimestamp - skewMs,
  };
}

/**
 * A countdown against a client-time deadline.
 *
 * Returns whole seconds for the readout and a percentage for the bar. Both are
 * floored at zero: a deadline that has passed reads 0, never a negative — the
 * server owns what happens next, and the client's job is only to stop counting.
 */
export function useCountdown(
  deadline: number | null,
  durationMs: number
): { seconds: number; percent: number; expired: boolean } {
  const { now } = useServerClock();

  // NaN is not a deadline either — arithmetic on a missing time field
  // produces one, and NaN comparisons are all false, so it must be named
  if (deadline === null || !Number.isFinite(deadline)) {
    return { seconds: 0, percent: 0, expired: true };
  }

  const remaining = Math.max(0, deadline - now);
  const percent =
    durationMs > 0
      ? Math.max(0, Math.min(100, (remaining / durationMs) * 100))
      : 0;

  return {
    seconds: Math.ceil(remaining / 1000),
    percent,
    expired: remaining <= 0,
  };
}
