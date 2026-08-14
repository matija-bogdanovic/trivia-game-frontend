import { configureStore } from '@reduxjs/toolkit';

import game from './slicers/game_slice';

export const store = configureStore({
  reducer: {
    game,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
