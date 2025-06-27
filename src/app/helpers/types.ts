/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { RefObject } from "react";
import { Option } from "../components/ui/game/question_ui";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import { AppDispatch } from "../redux/store";

export interface StartGame {
  sendJsonMessage: SendJsonMessage;
  loading: boolean;
  questionIdReference: RefObject<string | null>;
  lastJsonMessage: any;
  startButton: RefObject<HTMLButtonElement | null>;
  dispatch: AppDispatch;
}
// HandleSubmit types
export interface HandleSubmitTypes {
  decodedToken: any;
  selectedOption: string | undefined;
  questionIdReference: React.RefObject<string | null>;
  questionOptions: Option[];
  lastJsonMessage: any;
  playerParent: RefObject<HTMLDivElement | null>;
  intervalRef: React.RefObject<any | null>;
  dispatch: AppDispatch;
  timeoutRef: React.RefObject<any | null>;
  sendJsonMessage: any;
}
export interface PlayerData {
  id: string;
  player: string;
  points: number;
}
export interface Submit {
  status: boolean;
  username: string;
  message: string;
  correctAnswer: string;
}

// GameContext types
export interface GameContextType {
  startGameInitiator: any;
  overlay: boolean;
  playerParent: React.RefObject<HTMLDivElement | null>;
  startButton: React.RefObject<HTMLButtonElement | null>;
  roomInfo: React.RefObject<HTMLDivElement | null>;
  questionOptions: Option[];
  questionText: string;
  questionId: string;
  startButtonBox: React.RefObject<HTMLDivElement | null>;
  leaveRoom: () => Promise<void>;
  retrieveAndSetQuestion?: () => Promise<void>;

  intervalRef: React.RefObject<any | null>;
  timeoutRef: React.RefObject<any | null>;
  triggerLoop?: () => void;
  onSubmitHandler: (e: React.FormEvent) => void;
}
