'use client';

import type { AchievementView } from '@/app/(arena)/_lib/achievements';
import { Skeleton, SkeletonRegion } from '@/app/(arena)/_components/skeleton';
import { StarIcon } from '@/app/(arena)/_components/icons';
import { useT } from '@/app/lib/i18n';

/**
 * Achievements, unlocked against locked, from the wallet's own catalog.
 *
 * There is no icon in the data and no progress counter, so neither is drawn:
 * a badge is earned or it is not, and the mark says which. Inventing a
 * per-achievement emoji would be decorating server data with meaning the
 * server never sent.
 *
 * The grid owns its own loading state rather than each of the three screens
 * using it drawing badge-shaped bars of its own — the tile shape lives here,
 * so the placeholder for it belongs here too.
 */
export default function AchievementGrid({
  items,
  limit,
  loading = false,
}: {
  items: AchievementView[];
  /** show only the first N — the profile's summary strip */
  limit?: number;
  /** the catalog has not arrived yet — draw the tiles, not the emptiness */
  loading?: boolean;
}) {
  const { t } = useT();
  const shown = typeof limit === 'number' ? items.slice(0, limit) : items;

  /*
   * Before the wallet lands there is no catalog, so `items` is empty — and
   * "Nothing here yet." is the wrong sentence for a list still on its way.
   * The placeholder is the same tile at the same size, filling the same grid.
   */
  if (loading) {
    return (
      <SkeletonRegion className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: limit ?? 8 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 border border-white/[0.04] p-4"
          >
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="mt-auto h-2.5 w-12" />
          </div>
        ))}
      </SkeletonRegion>
    );
  }

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
            <StarIcon className="h-5 w-5" />
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
