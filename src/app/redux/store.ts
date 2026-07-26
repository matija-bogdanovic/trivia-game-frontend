import { configureStore } from '@reduxjs/toolkit';

import game from './slicers/game_slice';
import roomOperations from './slicers/room_opeations';

export const store = configureStore({
  reducer: {
    game,
    roomOperations,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
