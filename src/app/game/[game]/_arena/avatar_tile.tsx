'use client';

import { decodeAvatar } from '@/app/helpers/avatar';
import { getPort } from '@/app/helpers/port';

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
  const info = decodeAvatar(avatar);
  const base = `flex items-center justify-center font-bold flex-shrink-0 overflow-hidden ${className}`;

  if (info?.kind === 'upload') {
    return (
      // the backend serves these; next/image would need the host allow-listed
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`${getPort()}/avatar/img/${encodeURIComponent(username)}?v=${info.version}`}
        alt={displayName}
        className={`${base} object-cover`}
      />
    );
  }

  if (info?.kind === 'emoji') {
    return (
      <div
        className={base}
        style={{ backgroundColor: `hsl(${info.hue} 45% 30%)` }}
      >
        {info.emoji}
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
