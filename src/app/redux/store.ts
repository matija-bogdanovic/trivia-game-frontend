import { configureStore } from '@reduxjs/toolkit';

import reducer from './slicers/loop_and_overlay_slice';
import questionSlicer from './slicers/question_operations';
import playerSlicer from './slicers/player_operations';
import roomOperations from './slicers/room_opeations';

export const store = configureStore({
  reducer: {
    startGame: reducer,
    questionSettings: questionSlicer,
    playerSlicer: playerSlicer,
    roomOperations: roomOperations,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
