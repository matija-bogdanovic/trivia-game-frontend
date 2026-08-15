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
 * The one avatar in the app.
 *
 * There used to be three: this one, a lobby tile and an in-game one, each with
 * its own URL building, its own fallback colours and its own idea of what
 * shape an avatar is. They are all this component now, so a player looks the
 * same in the sidebar, the friends list, the lobby and mid-match.
 *
 * Always a circle — the photo, the legacy emoji and the initials fallback
 * share one round frame, so a player with a picture and one without read as
 * the same kind of thing.
 *
 * The picture URL comes from useAvatarSource, which takes the version from the
 * Redux avatar slice, so changing your picture updates every site at once.
 */
export default function Avatar({
  name,
  initial,
  username,
  avatar,
  size = 'md',
  accent = false,
  previewUrl,
  alt,
  className = '',
}: {
  /** display name — the initial is taken from it unless one is given */
  name?: string | null;
  initial?: string;
  /** required to build a picture URL; without it this renders a fallback */
  username?: string | null;
  /** the avatar string this caller holds, if any */
  avatar?: string | null;
  /** a named preset, or a pixel size for the in-game tiles */
  size?: AvatarSize | number;
  /** Gold fill — reserved for the winner, the host, or the active player. */
  accent?: boolean;
  /** a pending crop, shown before it has been uploaded */
  previewUrl?: string | null;
  alt?: string;
  className?: string;
}) {
  const { imageUrl, emoji } = useAvatarSource(username, avatar);
  const src = previewUrl ?? imageUrl;

  const letter = (initial ?? name ?? username ?? '?').charAt(0).toUpperCase();
  const label = alt ?? name ?? username ?? '';

  const numeric = typeof size === 'number';
  const sizeClass = numeric ? '' : SIZES[size];
  // a pixel size cannot come from a class, so those callers get inline styles
  const sizeStyle = numeric
    ? { width: size, height: size, fontSize: size * 0.4 }
    : undefined;

  const frame = `flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${sizeClass} ${className}`;

  if (src) {
    return (
      // the backend serves these and a data: URL cannot be optimised, so
      // next/image would need the host allow-listed for no benefit
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label}
        style={sizeStyle}
        className={`${frame} object-cover select-none`}
      />
    );
  }

  if (emoji) {
    return (
      <span
        className={frame}
        style={{
          ...sizeStyle,
          backgroundColor: `hsl(${emoji.hue} 45% 30%)`,
        }}
        aria-hidden="true"
      >
        {emoji.emoji}
      </span>
    );
  }

  return (
    <span
      className={`${frame} select-none ${accent ? 'bg-gold text-arena-950' : 'bg-arena-600 text-white'}`}
      style={sizeStyle}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
