'use client';

import { fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';

/** the avatar string stored in the Cognito `picture` attribute:
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

export function encodeUploadAvatar(version: number | string): string {
  return `u|${version}`;
}

export async function getMyAvatar(): Promise<string | null> {
  try {
    const attrs = await fetchUserAttributes();
    return attrs.picture ?? null;
  } catch {
    return null;
  }
}

export async function saveMyAvatar(avatar: string): Promise<void> {
  await updateUserAttributes({ userAttributes: { picture: avatar } });
}

/** downscale + center-crop a picked file to a square JPEG data URL */
export function fileToAvatarDataUrl(
  file: File,
  size = 256
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas unavailable'));
        return;
      }
      const side = Math.min(img.width, img.height);
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size
      );
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read image'));
    };
    img.src = url;
  });
}
