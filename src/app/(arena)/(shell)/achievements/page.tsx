'use client';

import { useT } from '@/app/lib/i18n';
import PageHeader from '@/app/(arena)/_components/page_header';
import AchievementGrid from '@/app/(arena)/_components/achievement_grid';
import { buildAchievements } from '@/app/(arena)/_lib/achievements';
import { useWallet } from '@/app/(arena)/_data/use_wallet';

/**
 * The achievement gallery, on the wallet's own catalog.
 *
 * It used to render a mock whose entries carried `progress` and `max`, so the
 * screen drew progress bars — "7 of 10 wins" — for numbers no server has ever
 * sent. The real catalog is a list of {id, name} and the wallet is a list of
 * unlocked ids: an achievement is earned or it is not. The bars are gone
 * rather than filled with a guess, and the only count shown is one that can be
 * counted.
 */
export default function Page() {
  const { t } = useT();
  const { wallet, loading, signedIn } = useWallet();

  const all = buildAchievements(
    wallet?.achievementCatalog,
    wallet?.achievements
  );
  const unlocked = all.filter((a) => a.unlocked);
  const locked = all.filter((a) => !a.unlocked);
  const percent = all.length
    ? Math.round((unlocked.length / all.length) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow={t('arena.achv.eyebrow')}
        title={t('arena.achv.title')}
      />

      {!signedIn && !loading && (
        <p className="text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.ach.signIn')}
        </p>
      )}

      {signedIn && (
        <>
          <section className="mb-8 flex flex-col gap-4 border border-white/[0.07] bg-arena-800 p-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="text-3xl font-bold text-gold tabular-nums">
              {unlocked.length}/{all.length}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 text-[10px] tracking-widest text-arena-300 uppercase">
                {t('arena.ach.completion', { n: percent })}
              </div>
              <div
                className="h-1.5 bg-arena-700"
                role="meter"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('arena.ach.completion', { n: percent })}
              >
                <div
                  className="h-full bg-gold"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </section>

          <h2 className="mb-3 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.ach.unlockedTitle', { n: unlocked.length })}
          </h2>
          <div className="mb-8">
            <AchievementGrid items={unlocked} />
          </div>

          <h2 className="mb-3 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.ach.lockedTitle', { n: locked.length })}
          </h2>
          <AchievementGrid items={locked} />
        </>
      )}
    </div>
  );
}
