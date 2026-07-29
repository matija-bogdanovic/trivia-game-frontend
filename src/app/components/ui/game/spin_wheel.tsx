'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useT } from '@/app/lib/i18n';
import Avatar from './avatar';

/**
 * The roulette: the highlight whips around the players at high speed,
 * then decelerates hard (quintic ease-out) so the final chambers tick
 * past in slow motion before locking onto the server-chosen target.
 */
function SpinWheel() {
  const { t } = useT();
  const { players, spinTarget, spinEndsAt, spinDurationMs } = useSelector(
    (state: RootState) => state.game
  );
  const alive = players.filter((p) => p.alive && !p.isSpectator);
  const [highlight, setHighlight] = useState(0);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!spinEndsAt || !spinTarget || alive.length === 0) return;
    setLanded(false);
    const targetIdx = Math.max(
      0,
      alive.findIndex((p) => p.username === spinTarget)
    );
    // lots of laps: a blur at first, a crawl at the end
    const totalSteps = alive.length * 7 + targetIdx;
    const start = spinEndsAt - spinDurationMs;
    let raf: number;
    const frame = () => {
      const time = Math.min(1, (Date.now() - start) / spinDurationMs);
      const eased = 1 - Math.pow(1 - time, 5);
      setHighlight(Math.floor(eased * totalSteps) % alive.length);
      if (time < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setHighlight(targetIdx);
        setLanded(true);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinEndsAt, spinTarget, spinDurationMs, alive.length]);

  const chosen = alive[highlight];

  return (
    <div className="fixed inset-0 z-10 bg-[rgba(0,0,0,0.7)] flex flex-col justify-center items-center gap-10">
      <p className="text-white text-2xl font-semibold">{t('game.whoNext')}</p>
      <div className="flex gap-6 flex-wrap justify-center px-8">
        {alive.map((p, i) => {
          const isCurrent = i === highlight;
          return (
            <div
              key={p.username}
              className={`flex flex-col items-center gap-2 transition-transform duration-100 ${
                isCurrent
                  ? landed
                    ? 'scale-150 duration-300'
                    : 'scale-125'
                  : landed
                    ? 'opacity-20 scale-90'
                    : 'opacity-40 scale-95'
              }`}
            >
              <div className="relative">
                {isCurrent && landed && (
                  <span className="absolute inset-0 rounded-full ring-4 ring-yellow-400 animate-ping"></span>
                )}
                <div
                  className={
                    isCurrent
                      ? 'rounded-full ring-4 ring-yellow-400'
                      : 'rounded-full'
                  }
                >
                  <Avatar
                    name={p.displayName}
                    username={p.username}
                    avatar={p.avatar}
                    size={64}
                  />
                </div>
              </div>
              <span className="text-white text-sm">{p.displayName}</span>
            </div>
          );
        })}
      </div>
      <p
        className={`text-3xl font-bold text-yellow-400 transition-opacity duration-300 ${
          landed ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {landed && chosen
          ? t('game.chosen', { name: chosen.displayName })
          : ' '}
      </p>
    </div>
  );
}

export default SpinWheel;
