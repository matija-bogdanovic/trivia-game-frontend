import { configureStore } from '@reduxjs/toolkit';

import avatar from './slicers/avatar_slice';
import game from './slicers/game_slice';
import invite from './slicers/invite_slice';
import notifications from './slicers/notification_slice';
import profile from './slicers/profile_slice';

export const store = configureStore({
  reducer: {
    avatar,
    game,
    invite,
    notifications,
    profile,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
