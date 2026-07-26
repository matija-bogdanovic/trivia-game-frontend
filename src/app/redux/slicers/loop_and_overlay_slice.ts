import { createSlice } from '@reduxjs/toolkit';

export interface LoopAndOverlayState {
  startedLoop: boolean;
  overlay: boolean;
  showStartButton: boolean;
  text: string;
  warningText: string;
}

const initialState: LoopAndOverlayState = {
  startedLoop: false,
  overlay: false,
  showStartButton: true,
  text: '',
  warningText: '',
};

const slicer = createSlice({
  name: 'gameStart',
  initialState,
  reducers: {
    overlayTrue: (state) => {
      state.overlay = true;
    },
    overlayFalse: (state) => {
      state.overlay = false;
    },
    overlayText: (state, action) => {
      state.text = action.payload;
    },
    submittedText: (state, action) => {
      state.warningText = action.payload;
    },
    showStartButton: (state) => {
      state.showStartButton = false;
    },
  },
});

export const {
  overlayTrue,
  overlayFalse,
  showStartButton,
  overlayText,
  submittedText,
} = slicer.actions;
export default slicer.reducer;
