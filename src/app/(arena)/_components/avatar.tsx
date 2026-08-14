export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, string> = {
  xs: 'h-8 w-8 text-sm',
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-20 w-20 text-4xl',
};

/**
 * The square initial tile every screen uses for a player.
 *
 * The Figma export repeated this markup across nine views with slightly
 * different sizes and colour rules each time; one component keeps them honest.
 */
export default function Avatar({
  initial,
  size = 'md',
  accent = false,
}: {
  initial: string;
  size?: AvatarSize;
  /** Gold fill — reserved for the winner, the host, or the active player. */
  accent?: boolean;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center font-bold ${SIZES[size]} ${
        accent ? 'bg-gold text-arena-950' : 'bg-arena-600 text-white'
      }`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
