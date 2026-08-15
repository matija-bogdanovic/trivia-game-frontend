import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Avatar versions, keyed by username.
 *
 * The image URL is `{API}/avatar/img/{username}?v={version}`, and the version
 * is the timestamp the server stamps into the wallet's `avatar` field as
 * "u|<ts>". Every render site used to carry its own copy of that value, so
 * uploading a new picture in Settings left the sidebar — and anywhere else the
 * same user appeared — pointed at the old URL, which the browser then served
 * from cache.
 *
 * Holding the version in one place fixes both halves at once: components read
 * the current version rather than a stale prop, and because the version is in
 * the query string a new one is a new URL, so the cache is bypassed rather
 * than fought.
 */
export interface AvatarState {
  /** username → version; absent means "no uploaded picture known" */
  versions: Record<string, string>;
}

const initialState: AvatarState = { versions: {} };

/** pulls the version out of a wallet avatar string; null for emoji/initials */
export function versionFromAvatar(
  avatar: string | null | undefined
): string | null {
  if (!avatar || !avatar.startsWith('u|')) return null;
  const version = avatar.slice(2);
  return version || null;
}

const avatarSlice = createSlice({
  name: 'avatar',
  initialState,
  reducers: {
    /** after an upload, or when a fresh wallet/player list arrives */
    setAvatarVersion: (
      state,
      action: PayloadAction<{ username: string; avatar: string | null }>
    ) => {
      const { username, avatar } = action.payload;
      const version = versionFromAvatar(avatar);
      if (version) state.versions[username] = version;
      else delete state.versions[username];
    },
    /** seed several at once — a player list, a friends list */
    seedAvatarVersions: (
      state,
      action: PayloadAction<{ username: string; avatar: string | null }[]>
    ) => {
      for (const { username, avatar } of action.payload) {
        const version = versionFromAvatar(avatar);
        if (version) state.versions[username] = version;
      }
    },
  },
});

export const { setAvatarVersion, seedAvatarVersions } = avatarSlice.actions;
export default avatarSlice.reducer;
