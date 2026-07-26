import React from 'react';

function hashHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

interface AvatarProps {
  name: string;
  size?: number;
}

/** Deterministic profile picture: same username always gets the same
 *  color + initials, with no upload infrastructure needed. */
function Avatar({ name, size = 48 }: AvatarProps) {
  const hue = hashHue(name);
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold select-none shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: `hsl(${hue} 65% 45%)`,
      }}
    >
      {initials}
    </div>
  );
}

export default Avatar;
