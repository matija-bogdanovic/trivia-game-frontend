'use client';

import type { AchievementView } from '@/app/(arena)/_lib/achievements';
import { useT } from '@/app/lib/i18n';

/**
 * Achievements, unlocked against locked, from the wallet's own catalog.
 *
 * There is no icon in the data and no progress counter, so neither is drawn:
 * a badge is earned or it is not, and the mark says which. Inventing a
 * per-achievement emoji would be decorating server data with meaning the
 * server never sent.
 */
export default function AchievementGrid({
  items,
  limit,
}: {
  items: AchievementView[];
  /** show only the first N — the profile's summary strip */
  limit?: number;
}) {
  const { t } = useT();
  const shown = typeof limit === 'number' ? items.slice(0, limit) : items;

  if (shown.length === 0) {
    return (
      <p className="text-[11px] tracking-wider text-arena-300 uppercase">
        {t('arena.ach.none')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {shown.map((a) => (
        <div
          key={a.id}
          className={`flex flex-col gap-1 border p-4 ${
            a.unlocked
              ? 'border-gold/20 bg-gold/5'
              : 'border-white/[0.04] opacity-50'
          }`}
        >
          <div
            className={`text-lg ${a.unlocked ? 'text-gold' : 'text-arena-500'}`}
            aria-hidden="true"
          >
            {a.unlocked ? '★' : '☆'}
          </div>
          <div
            className={`text-[11px] font-bold tracking-wider ${a.unlocked ? 'text-gold' : 'text-arena-300'}`}
          >
            {a.title}
          </div>
          {a.condition && (
            <div className="text-[10px] leading-snug text-arena-300">
              {a.condition}
            </div>
          )}
          <div className="mt-auto pt-1 text-[9px] tracking-widest text-arena-400 uppercase">
            {a.unlocked ? t('arena.ach.unlocked') : t('arena.ach.locked')}
          </div>
        </div>
      ))}
    </div>
  );
}
