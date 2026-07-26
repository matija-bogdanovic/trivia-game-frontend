/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GamePhase =
  | 'connecting'
  | 'lobby'
  | 'countdown'
  | 'question'
  | 'reveal'
  | 'gameover';

export interface GamePlayer {
  username: string;
  points: number;
  alive: boolean;
  connected: boolean;
  isHost: boolean;
}

export interface RoundResultEntry {
  username: string;
  answer: string | null;
  correct: boolean;
  timeMs: number | null;
  pointsDelta: number;
  eliminated: boolean;
}

export interface GameState {
  phase: GamePhase;
  roomName: string;
  code: number | null;
  minPlayers: number;
  players: GamePlayer[];
  round: number;
  countdown: number | null;
  questionText: string;
  options: string[];
  answerEndsAt: number | null;
  answerDurationMs: number;
  aliveCount: number;
  answeredCount: number;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  results: RoundResultEntry[];
  everyoneSpared: boolean;
  winner: string | null;
  totalRounds: number;
  standings: GamePlayer[];
  error: string | null;
}

const initialState: GameState = {
  phase: 'connecting',
  roomName: '',
  code: null,
  minPlayers: 2,
  players: [],
  round: 0,
  countdown: null,
  questionText: '',
  options: [],
  answerEndsAt: null,
  answerDurationMs: 0,
  aliveCount: 0,
  answeredCount: 0,
  selectedAnswer: null,
  correctAnswer: null,
  results: [],
  everyoneSpared: false,
  winner: null,
  totalRounds: 0,
  standings: [],
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    serverMessage: (
      state,
      action: PayloadAction<{ message: any; receivedAt: number }>
    ) => {
      const { message, receivedAt } = action.payload;
      switch (message.type) {
        case 'lobby_state':
          state.phase = message.phase;
          state.roomName = message.roomName;
          state.code = message.code;
          state.minPlayers = message.minPlayers;
          state.players = message.players;
          state.round = message.round;
          if (message.phase === 'lobby') {
            state.questionText = '';
            state.options = [];
            state.answerEndsAt = null;
            state.selectedAnswer = null;
            state.correctAnswer = null;
            state.results = [];
            state.winner = null;
            state.standings = [];
            state.countdown = null;
          }
          break;
        case 'game_countdown':
          state.phase = 'countdown';
          state.countdown = message.seconds;
          break;
        case 'round_start':
          state.phase = 'question';
          state.round = message.round;
          state.questionText = message.questionText;
          state.options = message.options;
          state.answerDurationMs = message.answerTimeMs;
          state.answerEndsAt = receivedAt + message.answerTimeMs;
          state.aliveCount = message.aliveCount;
          state.answeredCount = 0;
          state.selectedAnswer = null;
          state.correctAnswer = null;
          state.results = [];
          state.everyoneSpared = false;
          state.countdown = null;
          break;
        case 'player_answered':
          state.answeredCount = message.answeredCount;
          state.aliveCount = message.aliveCount;
          break;
        case 'round_result':
          state.phase = 'reveal';
          state.correctAnswer = message.correctAnswer;
          state.results = message.results;
          state.everyoneSpared = message.everyoneSpared;
          state.players = message.players;
          state.answerEndsAt = null;
          break;
        case 'game_over':
          state.phase = 'gameover';
          state.winner = message.winner;
          state.totalRounds = message.rounds;
          state.standings = message.standings;
          break;
        case 'error':
          state.error = message.message;
          break;
      }
    },
    selectAnswer: (state, action: PayloadAction<string>) => {
      if (state.phase === 'question' && state.selectedAnswer === null) {
        state.selectedAnswer = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetGame: () => initialState,
  },
});

export const { serverMessage, selectAnswer, clearError, resetGame } =
  gameSlice.actions;
export default gameSlice.reducer;
