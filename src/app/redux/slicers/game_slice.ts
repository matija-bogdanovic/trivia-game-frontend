/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GamePhase =
  | 'connecting'
  | 'lobby'
  | 'countdown'
  | 'spin'
  | 'question'
  | 'betting'
  | 'reveal'
  | 'picking'
  | 'gameover';

export interface GamePlayer {
  username: string;
  avatar: string | null;
  money: number;
  alive: boolean;
  connected: boolean;
  isHost: boolean;
}

export interface ChatMessage {
  /** null for system messages (joins, eliminations, ...) */
  username: string | null;
  text: string;
  at: number;
}

export type MyBet =
  | { kind: 'placed'; bet: 'correct' | 'wrong'; amount: number }
  | { kind: 'neutral' };

export interface BetOutcome {
  username: string;
  bet: 'correct' | 'wrong';
  amount: number;
  won: boolean;
  moneyDelta: number;
}

export interface GameState {
  phase: GamePhase;
  roomName: string;
  code: number | null;
  minPlayers: number;
  players: GamePlayer[];
  round: number;
  countdown: number | null;
  // spin
  spinTarget: string | null;
  spinEndsAt: number | null;
  spinDurationMs: number;
  // current turn
  answering: string | null;
  chainDepth: number;
  difficulty: number;
  questionText: string;
  options: string[];
  answerEndsAt: number | null;
  answerDurationMs: number;
  selectedAnswer: string | null;
  // betting
  betEndsAt: number | null;
  betDurationMs: number;
  myBet: MyBet | null;
  betCount: number;
  // reveal
  correctAnswer: string | null;
  lastAnswer: string | null;
  lastCorrect: boolean | null;
  timedOut: boolean;
  answererDelta: number;
  betOutcomes: BetOutcome[];
  eliminatedNow: string[];
  // picking
  picker: string | null;
  pickChoices: string[];
  pickEndsAt: number | null;
  pickDurationMs: number;
  // game over
  winner: string | null;
  totalRounds: number;
  standings: GamePlayer[];
  chatMessages: ChatMessage[];
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
  spinTarget: null,
  spinEndsAt: null,
  spinDurationMs: 0,
  answering: null,
  chainDepth: 0,
  difficulty: 1,
  questionText: '',
  options: [],
  answerEndsAt: null,
  answerDurationMs: 0,
  selectedAnswer: null,
  betEndsAt: null,
  betDurationMs: 0,
  myBet: null,
  betCount: 0,
  correctAnswer: null,
  lastAnswer: null,
  lastCorrect: null,
  timedOut: false,
  answererDelta: 0,
  betOutcomes: [],
  eliminatedNow: [],
  picker: null,
  pickChoices: [],
  pickEndsAt: null,
  pickDurationMs: 0,
  winner: null,
  totalRounds: 0,
  standings: [],
  chatMessages: [],
  error: null,
};

const CHAT_DISPLAY_LIMIT = 100;

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
            state.winner = null;
            state.standings = [];
            state.countdown = null;
            state.spinTarget = null;
            state.answering = null;
            state.picker = null;
            state.myBet = null;
            state.betOutcomes = [];
            state.eliminatedNow = [];
          }
          break;
        case 'game_countdown':
          state.phase = 'countdown';
          state.countdown = message.seconds;
          break;
        case 'spin':
          state.phase = 'spin';
          state.spinTarget = message.target;
          state.spinDurationMs = message.spinTimeMs;
          state.spinEndsAt = receivedAt + message.spinTimeMs;
          state.answering = null;
          state.picker = null;
          state.questionText = '';
          state.options = [];
          state.correctAnswer = null;
          state.myBet = null;
          break;
        case 'turn_question':
          state.phase = 'question';
          state.round = message.round;
          state.chainDepth = message.chainDepth;
          state.difficulty = message.difficulty;
          state.answering = message.answering;
          state.questionText = message.questionText;
          state.options = message.options;
          state.answerDurationMs = message.answerTimeMs;
          state.answerEndsAt = receivedAt + message.answerTimeMs;
          state.selectedAnswer = null;
          state.correctAnswer = null;
          state.lastAnswer = null;
          state.lastCorrect = null;
          state.timedOut = false;
          state.myBet = null;
          state.betCount = 0;
          state.betOutcomes = [];
          state.eliminatedNow = [];
          state.picker = null;
          state.spinTarget = null;
          state.spinEndsAt = null;
          state.countdown = null;
          break;
        case 'bet_start':
          state.phase = 'betting';
          state.betDurationMs = message.betTimeMs;
          state.betEndsAt = receivedAt + message.betTimeMs;
          state.answerEndsAt = null;
          break;
        case 'player_bet':
          state.betCount = message.betCount;
          break;
        case 'round_result':
          state.phase = 'reveal';
          state.correctAnswer = message.correctAnswer;
          state.lastAnswer = message.answer;
          state.lastCorrect = message.correct;
          state.timedOut = message.timedOut;
          state.answererDelta = message.answererDelta;
          state.betOutcomes = message.bets ?? [];
          state.eliminatedNow = message.eliminated ?? [];
          state.players = message.players;
          state.answerEndsAt = null;
          state.betEndsAt = null;
          break;
        case 'pick_start':
          state.phase = 'picking';
          state.picker = message.picker;
          state.pickChoices = message.choices;
          state.pickDurationMs = message.pickTimeMs;
          state.pickEndsAt = receivedAt + message.pickTimeMs;
          break;
        case 'picked':
          state.chainDepth = message.chainDepth;
          break;
        case 'game_over':
          state.phase = 'gameover';
          state.winner = message.winner;
          state.totalRounds = message.rounds;
          state.standings = message.standings;
          break;
        case 'chat_history':
          state.chatMessages = message.messages;
          break;
        case 'chat_message':
          state.chatMessages.push({
            username: message.username,
            text: message.text,
            at: message.at,
          });
          if (state.chatMessages.length > CHAT_DISPLAY_LIMIT) {
            state.chatMessages.splice(
              0,
              state.chatMessages.length - CHAT_DISPLAY_LIMIT
            );
          }
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
    setMyBet: (state, action: PayloadAction<MyBet>) => {
      if (
        (state.phase === 'question' || state.phase === 'betting') &&
        state.myBet === null
      ) {
        state.myBet = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetGame: () => initialState,
  },
});

export const { serverMessage, selectAnswer, setMyBet, clearError, resetGame } =
  gameSlice.actions;
export default gameSlice.reducer;
