'use client';

import { fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';

/** avatars everyone can use; more are unlockable in the shop */
export const FREE_AVATARS = [
  '🦊',
  '🐸',
  '🐼',
  '🐙',
  '🦁',
  '🐺',
  '🐨',
  '🐷',
  '🐤',
  '🦉',
];

export const AVATAR_HUES = [0, 30, 60, 120, 180, 210, 260, 300];

/** encode a chosen avatar as stored in Cognito + sent to the game server */
export function encodeAvatar(emoji: string, hue: number): string {
  return `e|${emoji}|${hue}`;
}

export function decodeAvatar(
  avatar: string | null | undefined
): { emoji: string; hue: number } | null {
  if (!avatar || !avatar.startsWith('e|')) return null;
  const [, emoji, hueRaw] = avatar.split('|');
  const hue = Number(hueRaw);
  if (!emoji || Number.isNaN(hue)) return null;
  return { emoji, hue };
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
