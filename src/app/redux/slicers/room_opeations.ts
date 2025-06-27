import { getPort } from "@/app/helpers/port";
import { decodeJwt, getCookie } from "@/app/helpers/token_operations";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RoomState {
  roomNameText: string;
  roomCodeText: string;
  overlayText: string;
  cancel: boolean;
  loading: boolean;
  answer: boolean;
  code: string;
  username: string;
  port: string;
  decodedToken: string;
}

const initialState: RoomState = {
  roomNameText: "",
  roomCodeText: "",
  overlayText: "",
  port: "",
  code: "",
  username: "",
  decodedToken: "",
  cancel: false,
  loading: false,
  answer: false,
};

const roomOperations = createSlice({
  name: "roomOperations",
  initialState,
  reducers: {
    setRoomData: (
      state,
      action: PayloadAction<{
        roomName: string;
        code: number;
      }>
    ) => {
      state.roomNameText = `Room name: ${action.payload.roomName}`;
      state.roomCodeText = `Room code: ${action.payload.code}`;
    },
    setTokenDetails: (state) => {
      const cookie = getCookie("token");
      const token = decodeJwt(cookie);
      const port = getPort();
      const code = window.location.pathname.split("/")[2];
      state.code = code;
      state.username = token.username;
      state.port = port;
      state.decodedToken = cookie as string;
    },
    cancelLeave: (state) => {
      state.cancel = true;
      state.overlayText = "Are you sure you want to leave the room?";
    },
    toggleCancel: (state) => {
      state.cancel = !state.cancel;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    answerCorrect: (state, action) => {
      state.answer = action.payload;
    },
    setRoomCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
    },
  },
});

export const {
  setRoomData,
  cancelLeave,
  toggleCancel,
  setLoading,
  answerCorrect,
  setRoomCode,
  setTokenDetails,
} = roomOperations.actions;
export default roomOperations.reducer;
