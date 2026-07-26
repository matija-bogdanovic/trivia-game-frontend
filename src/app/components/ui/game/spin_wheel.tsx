'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import Avatar from './avatar';

/**
 * The roulette: cycles a highlight across the alive players, easing out
 * until it lands on the server-chosen target exactly as the spin ends.
 */
function SpinWheel() {
  const { players, spinTarget, spinEndsAt, spinDurationMs } = useSelector(
    (state: RootState) => state.game
  );
  const alive = players.filter((p) => p.alive);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (!spinEndsAt || !spinTarget || alive.length === 0) return;
    const targetIdx = Math.max(
      0,
      alive.findIndex((p) => p.username === spinTarget)
    );
    // enough full laps that it feels like a spin, ending on the target
    const totalSteps = alive.length * 4 + targetIdx;
    const start = spinEndsAt - spinDurationMs;
    let raf: number;
    const frame = () => {
      const t = Math.min(1, (Date.now() - start) / spinDurationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setHighlight(Math.floor(eased * totalSteps) % alive.length);
      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setHighlight(targetIdx);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinEndsAt, spinTarget, spinDurationMs, alive.length]);

  return (
    <div className="fixed inset-0 z-10 bg-[rgba(0,0,0,0.6)] flex flex-col justify-center items-center gap-8">
      <p className="text-white text-2xl font-semibold">
        Who answers next? 🎯
      </p>
      <div className="flex gap-6 flex-wrap justify-center px-8">
        {alive.map((p, i) => (
          <div
            key={p.username}
            className={`flex flex-col items-center gap-2 transition-transform duration-100 ${
              i === highlight ? 'scale-125' : 'opacity-50'
            }`}
          >
            <div
              className={
                i === highlight
                  ? 'rounded-full ring-4 ring-yellow-400'
                  : 'rounded-full'
              }
            >
              <Avatar name={p.username} size={64} />
            </div>
            <span className="text-white text-sm">{p.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpinWheel;
