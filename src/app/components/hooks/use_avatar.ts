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
  /*
   * The avatar string the store knows for this user, used when the caller did
   * not pass one — which ten of the twenty <Avatar> call sites do not. They
   * have a username and nothing else, and before this they could only ever
   * render an upload, because the store held nothing but upload versions.
   */
  const storedAvatar = useSelector((state: RootState) =>
    username ? state.avatar.avatars[username] : undefined
  );

  const source = fallbackAvatar ?? storedAvatar;
  const info = decodeAvatar(source);

  /*
   * One line, in development only, from the one place that knows everything:
   * who is being drawn, what avatar string was available, where it came from,
   * and what the decoder made of it.
   *
   * Every earlier round of this was a guess about which link was broken, and
   * each guess cost a sign-in to test. This prints the whole chain at once —
   * "no string at all" and "a string the decoder rejected" and "decoded fine,
   * so the image itself must be failing" are three different problems that all
   * look identical on screen.
   *
   * Only for a signed-in-looking render: a list of initials placeholders would
   * otherwise fill the console with nothing.
   */
  if (process.env.NODE_ENV !== 'production' && username) {
    console.debug(
      `[avatar] ${username}: source=${
        fallbackAvatar ? 'prop' : storedAvatar ? 'store' : 'NONE'
      } value=${source ?? '(none)'} decoded=${info ? info.kind : 'null'}`
    );
  }

  /*
   * A federated picture is a plain URL, so there is nothing to version and
   * nothing to cache-bust — but an UPLOAD still wins over it. Uploading is the
   * act of choosing, and the store's version is how a just-finished upload
   * reaches every render site before any wallet is re-fetched.
   */
  if (info?.kind === 'remote' && !storedVersion) {
    return { imageUrl: info.url, emoji: null };
  }

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
