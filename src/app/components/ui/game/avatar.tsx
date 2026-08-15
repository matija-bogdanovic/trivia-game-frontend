'use client';

import Avatar from '@/app/(arena)/_components/avatar';

interface AvatarProps {
  /** display name — used for initials and alt text */
  name: string;
  /** unique account id — keys the uploaded image; defaults to name */
  username?: string;
  /** avatar string from the profile ("u|<version>" = uploaded photo) */
  avatar?: string | null;
  size?: number;
}

/**
 * The in-game avatar, kept only as an adapter.
 *
 * It used to build its own image URL, colour its own initials from a name hash
 * and size itself with inline styles. All of that is the shared Avatar now —
 * this exists so the game screens can keep passing a pixel size and a
 * `name` without every call site changing.
 */
function GameAvatar({ name, username, avatar = null, size = 48 }: AvatarProps) {
  return (
    <Avatar
      name={name}
      username={username ?? name}
      avatar={avatar}
      size={size}
    />
  );
}

export default GameAvatar;
