'use client';

import { useAvatarSource } from '@/app/components/hooks/use_avatar';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, string> = {
  xs: 'h-8 w-8 text-sm',
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-20 w-20 text-4xl',
};

/**
 * A player's avatar: their uploaded picture, a legacy emoji, or their initial.
 *
 * Always a circle, in every variant — the image, the emoji and the initials
 * fallback all share the same round frame so a user with a photo and one
 * without look like the same kind of thing.
 *
 * The picture URL comes from useAvatarSource, which reads the version out of
 * the store, so an upload elsewhere in the app updates this instantly.
 */
export default function Avatar({
  initial,
  username,
  avatar,
  size = 'md',
  accent = false,
  /** a pending crop, shown before it has been uploaded */
  previewUrl,
  alt,
}: {
  initial: string;
  /** required to build a picture URL; without it this renders initials */
  username?: string | null;
  /** the avatar string this caller holds, if any */
  avatar?: string | null;
  size?: AvatarSize;
  /** Gold fill — reserved for the winner, the host, or the active player. */
  accent?: boolean;
  previewUrl?: string | null;
  alt?: string;
}) {
  const { imageUrl, emoji } = useAvatarSource(username, avatar);
  const src = previewUrl ?? imageUrl;
  const frame = `flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${SIZES[size]}`;

  if (src) {
    return (
      // the backend serves these and a data: URL cannot be optimised, so
      // next/image would need the host allow-listed for no benefit
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? initial}
        className={`${frame} object-cover select-none`}
      />
    );
  }

  if (emoji) {
    return (
      <span
        className={frame}
        style={{ backgroundColor: `hsl(${emoji.hue} 45% 30%)` }}
        aria-hidden="true"
      >
        {emoji.emoji}
      </span>
    );
  }

  return (
    <span
      className={`${frame} ${accent ? 'bg-gold text-arena-950' : 'bg-arena-600 text-white'}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
