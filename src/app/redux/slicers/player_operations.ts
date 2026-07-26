import { PlayerData } from '@/app/helpers/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PlayerState {
  playerArray: PlayerData[];
  playerLoading: boolean;
}

const initialState: PlayerState = {
  playerArray: [],
  playerLoading: true,
};

const playerSlice = createSlice({
  name: 'playerSlice',
  initialState,
  reducers: {
    setPlayers: (
      state,
      action: PayloadAction<{
        players: Record<string, PlayerData>;
        token: string;
      }>
    ) => {
      const { players, token } = action.payload;

      const sortedPlayers = Object.values(players).sort((a, b) => {
        if (a.id === token) return -1;
        if (b.id === token) return 1;
        return 0;
      });

      state.playerArray = sortedPlayers;
      state.playerLoading = false;
    },
  },
});

export const { setPlayers } = playerSlice.actions;
export default playerSlice.reducer;
