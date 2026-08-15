import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * The signed-in player's display name.
 *
 * It lives here for the same reason the avatar version does: several screens
 * show it at once — the sidebar strip, the profile header, the Settings field
 * — and each held its own copy taken from the id token. Editing the name in
 * Settings left the others showing the old one until a reload, because the id
 * token only picks up an attribute change on its next refresh.
 *
 * Reading it from one place means a save updates every screen immediately,
 * with the token value as the fallback until the store is seeded.
 */
export interface ProfileState {
  displayName: string | null;
}

const initialState: ProfileState = { displayName: null };

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    /** casing is the point — this is stored exactly as given */
    setDisplayName: (state, action: PayloadAction<string | null>) => {
      const next = action.payload?.trim();
      state.displayName = next ? next : null;
    },
  },
});

export const { setDisplayName } = profileSlice.actions;
export default profileSlice.reducer;
