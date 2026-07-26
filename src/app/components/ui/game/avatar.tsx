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
  name: string;
  /** chosen avatar string ("e|🦊|200"); falls back to initials */
  avatar?: string | null;
  size?: number;
}

/** Profile picture: the player's chosen emoji+color, or a deterministic
 *  initials avatar derived from the username. */
function Avatar({ name, avatar = null, size = 48 }: AvatarProps) {
  const chosen = decodeAvatar(avatar);
  const hue = chosen ? chosen.hue : hashHue(name);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold select-none shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: chosen ? size * 0.55 : size * 0.38,
        backgroundColor: `hsl(${hue} 65% 45%)`,
      }}
    >
      {chosen ? chosen.emoji : name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default Avatar;
