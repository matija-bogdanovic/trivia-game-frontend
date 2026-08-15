'use client';

import { useSelector } from 'react-redux';
import { decodeAvatar } from '@/app/helpers/avatar';
import { getPort } from '@/app/helpers/port';
import type { RootState } from '@/app/redux/store';

export interface AvatarSource {
  /** the uploaded picture, already cache-busted; null when there is none */
  imageUrl: string | null;
  /** legacy emoji avatar, when that is what the player has */
  emoji: { emoji: string; hue: number } | null;
}

/**
 * The one place an avatar URL is built.
 *
 * The version comes from the store first and the caller's own value second, so
 * a fresh upload reaches every render site the moment it is dispatched — the
 * component does not need to re-fetch whatever gave it the avatar string. The
 * fallback keeps screens working before anything has seeded the store.
 */
export function useAvatarSource(
  username: string | null | undefined,
  /** the avatar string this caller happens to hold, e.g. from a player list */
  fallbackAvatar?: string | null
): AvatarSource {
  const storedVersion = useSelector((state: RootState) =>
    username ? state.avatar.versions[username] : undefined
  );

  const info = decodeAvatar(fallbackAvatar);

  if (info?.kind === 'emoji' && !storedVersion) {
    return { imageUrl: null, emoji: info };
  }

  const version =
    storedVersion ?? (info?.kind === 'upload' ? info.version : undefined);

  if (!username || !version) return { imageUrl: null, emoji: null };

  return {
    imageUrl: `${getPort()}/avatar/img/${encodeURIComponent(username)}?v=${version}`,
    emoji: null,
  };
}
