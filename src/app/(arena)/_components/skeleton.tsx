'use client';

import { useT } from '@/app/lib/i18n';

/**
 * The app's loading placeholders.
 *
 * One shimmer, defined once in globals.css as `.skeleton`, applied through
 * these four pieces — so every screen's waiting state pulses at the same rate
 * in the same colour, which is what makes a placeholder read as "not yet"
 * rather than as a broken control.
 *
 * WHAT A SKELETON IS FOR: standing in for content whose SHAPE is already
 * known. A list of ten rooms becomes a few room-shaped bars; a profile card
 * becomes a card. That is the whole value of it over a spinner — the page
 * stops jumping when the data lands, because the placeholder already occupied
 * the space the content will.
 *
 * WHAT IT IS NOT FOR: a wait with no known shape, or an outcome that might be
 * nothing at all. An empty state, a failed request and a sign-in prompt are
 * answers, and answering with a skeleton says "still coming" about something
 * that has already arrived. Screens here keep those branches distinct and show
 * the skeleton only while the fetch is genuinely in flight.
 *
 * ACCESSIBILITY: the bars themselves are decoration and are hidden from the
 * accessibility tree — a screen reader has nothing to gain from eight nested
 * empty boxes. SkeletonRegion carries the one announcement that matters, so
 * wrap a screen's placeholders in it rather than leaving them unlabelled.
 */

/** avatar diameters, matching the Avatar component's own size table */
const AVATAR_SIZES: Record<string, string> = {
  xs: 'h-8 w-8',
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
};

/**
 * One placeholder bar. Size it with utilities, as you would the real element:
 * `<Skeleton className="h-4 w-32" />`.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/**
 * A run of text lines. The last is short, because the last line of a real
 * paragraph is — a stack of identical full-width bars reads as a table.
 */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/** A round avatar placeholder, at one of Avatar's own sizes. */
export function SkeletonAvatar({
  size = 'md',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <Skeleton
      className={`shrink-0 rounded-full ${AVATAR_SIZES[size]} ${className}`}
    />
  );
}

/**
 * The wrapper that speaks for a screenful of placeholders.
 *
 * `role="status"` with `aria-busy` announces the wait once, in words, instead
 * of leaving a screen reader to infer it from decoration it cannot see. The
 * label defaults to the app's own "loading" string in the current language.
 */
export function SkeletonRegion({
  children,
  label,
  className = '',
}: {
  children: React.ReactNode;
  /** overrides the default "Loading…" — use when the wait has a better name */
  label?: string;
  className?: string;
}) {
  const { t } = useT();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label ?? t('arena.common.loading')}
      className={className}
    >
      {children}
    </div>
  );
}
