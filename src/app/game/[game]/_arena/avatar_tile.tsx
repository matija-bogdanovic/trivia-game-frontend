'use client';

import { useAvatarSource } from '@/app/components/hooks/use_avatar';

/**
 * The design draws every player as a flat square with their initial. Players
 * carry a real avatar though, so an uploaded photo or legacy emoji wins when
 * there is one and the initial stays as the fallback — same square either way.
 */
export default function AvatarTile({
  username,
  displayName,
  avatar,
  className = '',
  accent = false,
}: {
  username: string;
  displayName: string;
  avatar: string | null;
  /** sizing + text classes, e.g. "w-12 h-12 text-lg" */
  className?: string;
  /** host / winner styling */
  accent?: boolean;
}) {
  const { imageUrl, emoji } = useAvatarSource(username, avatar);
  const base = `flex items-center justify-center font-bold flex-shrink-0 overflow-hidden rounded-full ${className}`;

  if (imageUrl) {
    return (
      // the backend serves these; next/image would need the host allow-listed
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={displayName}
        className={`${base} object-cover`}
      />
    );
  }

  if (emoji) {
    return (
      <div
        className={base}
        style={{ backgroundColor: `hsl(${emoji.hue} 45% 30%)` }}
      >
        {emoji.emoji}
      </div>
    );
  }

  return (
    <div
      className={`${base} ${accent ? 'bg-gold text-arena-950' : 'bg-arena-600 text-white'}`}
    >
      {(displayName || username || '?').charAt(0).toUpperCase()}
    </div>
  );
}
