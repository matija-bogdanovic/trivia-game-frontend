import React from 'react';
import { decodeAvatar } from '@/app/helpers/avatar';

function hashHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

interface AvatarProps {
  /** display name — used for initials and alt text */
  name: string;
  /** unique account id — keys the uploaded image; defaults to name */
  username?: string;
  /** avatar string from the profile ("u|<version>" = uploaded photo) */
  avatar?: string | null;
  size?: number;
}

/** Profile picture: the player's uploaded photo, a legacy emoji avatar,
 *  or deterministic initials derived from the display name. */
function Avatar({ name, username, avatar = null, size = 48 }: AvatarProps) {
  const info = decodeAvatar(avatar);

  if (info?.kind === 'upload') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://7pqkxtdnod.execute-api.eu-west-3.amazonaws.com/deployedStage/avatar/img/${encodeURIComponent(username ?? name)}?v=${info.version}`}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover select-none shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  const hue = info?.kind === 'emoji' ? info.hue : hashHue(name);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold select-none shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: info?.kind === 'emoji' ? size * 0.55 : size * 0.38,
        backgroundColor: `hsl(${hue} 65% 45%)`,
      }}
    >
      {info?.kind === 'emoji' ? info.emoji : name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default Avatar;
