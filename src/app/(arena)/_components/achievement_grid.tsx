'use client';

import type { AchievementView } from '@/app/(arena)/_lib/achievements';
import { Skeleton, SkeletonRegion } from '@/app/(arena)/_components/skeleton';
import { faceFor } from '@/app/(arena)/_lib/achievement_icons';
import { useT } from '@/app/lib/i18n';

/**
 * Achievements, unlocked against locked, from the wallet's own catalog.
 *
 * There is no progress counter in the data, so none is drawn: a badge is
 * earned or it is not, and the mark says which.
 *
 * There is no icon either. The face comes from _lib/achievement_icons, mapped
 * onto the server's id — mapping is not inventing, and an id with no mapping
 * keeps the star rather than being assigned something plausible.
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
            className="flex flex-col gap-2 rounded-sm border border-white/[0.04] p-4"
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
      {shown.map((a) => {
        const face = faceFor(a.id);
        return (
          <div
            key={a.id}
            className={`flex flex-col gap-1 rounded-sm border p-4 ${
              a.unlocked
                ? 'border-gold/20 bg-gold/5'
                : 'border-white/[0.04] opacity-50'
            }`}
          >
            {/*
            The badge's own colour only once it is EARNED. A red drop glowing
            beside the word LOCKED would be the tile announcing something the
            player has not done.
          */}
            <div
              className={`text-lg ${a.unlocked ? face.tone : 'text-arena-500'}`}
              aria-hidden="true"
            >
              <face.Icon className="h-5 w-5" />
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
        );
      })}
    </div>
  );
}
