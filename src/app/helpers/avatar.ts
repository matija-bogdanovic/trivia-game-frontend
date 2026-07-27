'use client';

/** the avatar string stored in the player's wallet:
 *  - "u|<version>"     uploaded photo, served from the backend
 *  - "e|<emoji>|<hue>" legacy emoji avatar (still rendered)
 *  - anything else     initials fallback */
export type AvatarInfo =
  | { kind: 'upload'; version: string }
  | { kind: 'emoji'; emoji: string; hue: number };

export function decodeAvatar(
  avatar: string | null | undefined
): AvatarInfo | null {
  if (!avatar) return null;
  if (avatar.startsWith('u|')) {
    const version = avatar.slice(2);
    return version ? { kind: 'upload', version } : null;
  }
  if (avatar.startsWith('e|')) {
    const [, emoji, hueRaw] = avatar.split('|');
    const hue = Number(hueRaw);
    if (!emoji || Number.isNaN(hue)) return null;
    return { kind: 'emoji', emoji, hue };
  }
  return null;
}

/** read a picked file into a data URL for the cropper */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('could not read image'));
    reader.readAsDataURL(file);
  });
}

export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** render the user-chosen crop area to a square JPEG data URL */
export function cropToAvatarDataUrl(
  imageSrc: string,
  crop: CropPixels,
  size = 256
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas unavailable'));
        return;
      }
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        size,
        size
      );
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('could not read image'));
    img.src = imageSrc;
  });
}
