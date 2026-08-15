import { configureStore } from '@reduxjs/toolkit';

import avatar from './slicers/avatar_slice';
import game from './slicers/game_slice';

export const store = configureStore({
  reducer: {
    avatar,
    game,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
