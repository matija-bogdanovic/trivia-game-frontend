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
  | 'duel'
  | 'gameover';

export interface DuelGuess {
  username: string;
  guess: number | null;
  diff: number | null;
}

export interface GamePlayer {
  /** unique account id — the identity key */
  username: string;
  /** what's shown on screen */
  displayName: string;
  avatar: string | null;
  money: number;
  alive: boolean;
  connected: boolean;
  isHost: boolean;
  streak: number;
  isSpectator: boolean;
}

/** what to call a player on screen, given their unique username */
export function displayNameOf(
  players: GamePlayer[] | undefined | null,
  username: string | null | undefined
): string {
  if (!username) return '';
  // tolerant of a missing list: this is called from render paths with
  // whatever array the caller has, and a name is never worth a crash
  return players?.find((p) => p.username === username)?.displayName ?? username;
}

export interface AchievementNotice {
  username: string;
  ids: string[];
  names: string[];
}

export interface ChatMessage {
  /** null for system messages (joins, eliminations, ...) */
  username: string | null;
  displayName?: string | null;
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
  /**
   * Seat limits, as sent by the server. Null until the first lobby_state —
   * they used to default to 2 and 6, which are the server's real constants but
   * were still a guess on the client: the lobby drew six seats and claimed a
   * minimum before it had been told either.
   */
  minPlayers: number | null;
  maxPlayers: number | null;
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
  achievementNotice: AchievementNotice | null;
  // duel
  duelKind: 'guess' | 'code' | null;
  duelPlayers: string[];
  myGuessSubmitted: boolean;
  // code duel
  codeSymbols: string[];
  codeLength: number;
  maxCodeAttempts: number;
  myCodeAttempts: { guess: string[]; exact: number; partial: number }[];
  codeProgress: Record<
    string,
    { attempt: number; exact: number; partial: number }[]
  >;
  secretCode: string[] | null;
  codeCracked: boolean;
  correctValue: number | null;
  duelGuesses: DuelGuess[];
  duelWinner: string | null;
  duelLoser: string | null;
  duelTie: boolean;
  duelLoserDelta: number;
  kicked: boolean;
  /**
   * Why, when the server says. 'host' is the only reason it sends today; the
   * field exists so a later one (idle, banned) can be told apart rather than
   * all of them reading as "the host removed you".
   */
  kickedReason: string | null;
  terminated: boolean;
  isPrivate: boolean;
  /**
   * Why the server refused the join. 'unauthenticated' is what it sends for a
   * missing or expired token — it was missing from this union, so the UI fell
   * through to the password prompt and asked a signed-out player for a room
   * password they could never supply.
   */
  joinDenied:
    | 'password_required'
    | 'wrong_password'
    | 'room_full'
    | 'unauthenticated'
    | null;
  /**
   * Set when the server tears the room down under everyone — currently only
   * `host_left`. Distinct from `terminated`, which is the host explicitly
   * closing a lobby they stayed in.
   */
  roomClosed: string | null;
  /**
   * The action the server refused because the turn engine is not built yet.
   * The UI localises it; the slice only records which one.
   */
  notImplemented: string | null;
  error: string | null;
}

const initialState: GameState = {
  phase: 'connecting',
  roomName: '',
  code: null,
  minPlayers: null,
  maxPlayers: null,
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
  achievementNotice: null,
  roomClosed: null,
  notImplemented: null,
  duelKind: null,
  duelPlayers: [],
  myGuessSubmitted: false,
  codeSymbols: [],
  codeLength: 4,
  maxCodeAttempts: 6,
  myCodeAttempts: [],
  codeProgress: {},
  secretCode: null,
  codeCracked: false,
  correctValue: null,
  duelGuesses: [],
  duelWinner: null,
  duelLoser: null,
  duelTie: false,
  duelLoserDelta: 0,
  kicked: false,
  kickedReason: null,
  terminated: false,
  isPrivate: false,
  joinDenied: null,
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
          state.isPrivate = message.isPrivate ?? false;
          state.joinDenied = null;
          state.minPlayers =
            typeof message.minPlayers === 'number' ? message.minPlayers : null;
          state.maxPlayers =
            typeof message.maxPlayers === 'number' ? message.maxPlayers : null;
          state.players = message.players ?? [];
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
        /*
         * The authoritative match state, and the only message that carries a
         * roster once a game is running — money, alive, streak and all. The
         * server sends it immediately before every phase message ("state first
         * so the client can render off it, then the phase event"), and this
         * reducer ignored it completely: there was no case for it at all.
         *
         * That absence is why the phase messages were being mined for a
         * `players` field they do not have. Phase is deliberately not taken
         * from here — the phase message that follows owns that, and it carries
         * the remaining time with it.
         */
        case 'game_state': {
          const s = message.state ?? {};
          if (Array.isArray(s.players)) state.players = s.players;
          if (typeof s.round === 'number') state.round = s.round;
          if (typeof s.chainDepth === 'number') state.chainDepth = s.chainDepth;
          if (typeof s.code === 'number') state.code = s.code;
          if (typeof s.roomName === 'string') state.roomName = s.roomName;
          if (typeof s.minPlayers === 'number') state.minPlayers = s.minPlayers;
          if (typeof s.maxPlayers === 'number') state.maxPlayers = s.maxPlayers;
          break;
        }
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
        case 'code_duel_start':
          state.phase = 'duel';
          state.duelKind = 'code';
          state.round = message.round;
          state.duelPlayers = message.players ?? [];
          state.codeSymbols = message.symbols;
          state.codeLength = message.codeLength;
          state.maxCodeAttempts = message.maxAttempts;
          state.answerDurationMs = message.answerTimeMs;
          state.answerEndsAt = receivedAt + message.answerTimeMs;
          state.myCodeAttempts = [];
          state.codeProgress = {};
          state.secretCode = null;
          state.codeCracked = false;
          state.questionText = '';
          state.options = [];
          state.answering = null;
          state.correctAnswer = null;
          state.correctValue = null;
          state.duelGuesses = [];
          state.spinTarget = null;
          state.spinEndsAt = null;
          state.eliminatedNow = [];
          state.betOutcomes = [];
          state.duelWinner = null;
          state.duelLoser = null;
          state.duelTie = false;
          break;
        case 'code_feedback':
          state.myCodeAttempts.push({
            guess: message.guess,
            exact: message.exact,
            partial: message.partial,
          });
          break;
        case 'code_progress': {
          const list = state.codeProgress[message.username] ?? [];
          list.push({
            attempt: message.attempt,
            exact: message.exact,
            partial: message.partial,
          });
          state.codeProgress[message.username] = list;
          break;
        }
        case 'code_duel_result':
          state.phase = 'reveal';
          state.duelKind = 'code';
          state.secretCode = message.code;
          state.codeCracked = message.cracked;
          state.duelWinner = message.winner;
          state.duelLoser = message.loser;
          state.duelTie = message.tie;
          state.duelLoserDelta = message.loserDelta;
          state.eliminatedNow = message.eliminated ?? [];
          // the two duellists, not the room: assigning them to the roster
          // shrank the player list to whoever happened to be duelling
          state.duelPlayers = message.players ?? [];
          state.answerEndsAt = null;
          break;
        case 'duel_question':
          state.phase = 'duel';
          state.duelKind = 'guess';
          state.round = message.round;
          state.questionText = message.questionText;
          state.duelPlayers = message.players ?? [];
          state.answerDurationMs = message.answerTimeMs;
          state.answerEndsAt = receivedAt + message.answerTimeMs;
          state.myGuessSubmitted = false;
          state.correctValue = null;
          state.duelGuesses = [];
          state.duelWinner = null;
          state.duelLoser = null;
          state.duelTie = false;
          state.options = [];
          state.answering = null;
          state.correctAnswer = null;
          state.spinTarget = null;
          state.spinEndsAt = null;
          state.eliminatedNow = [];
          state.betOutcomes = [];
          break;
        case 'duel_result':
          state.phase = 'reveal';
          state.correctValue = message.correctValue;
          state.duelGuesses = message.guesses;
          state.duelWinner = message.winner;
          state.duelLoser = message.loser;
          state.duelTie = message.tie;
          state.duelLoserDelta = message.loserDelta;
          state.eliminatedNow = message.eliminated ?? [];
          // the two duellists, not the room: assigning them to the roster
          // shrank the player list to whoever happened to be duelling
          state.duelPlayers = message.players ?? [];
          state.answerEndsAt = null;
          break;
        case 'turn_question':
          state.phase = 'question';
          state.round = message.round;
          state.chainDepth = message.chainDepth;
          state.difficulty = message.difficulty;
          state.answering = message.answering;
          state.questionText = message.questionText;
          state.options = message.options ?? [];
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
          state.duelPlayers = [];
          state.duelKind = null;
          state.correctValue = null;
          state.duelGuesses = [];
          state.myGuessSubmitted = false;
          state.secretCode = null;
          state.myCodeAttempts = [];
          state.codeProgress = {};
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
          /*
           * NOT state.players. round_result does not carry a roster — it
           * reports one round: who answered, whether they were right, the
           * pot, the bet settlements and who went out. This line assigned
           * the missing field anyway, so answering a question set
           * state.players to undefined and the next render threw
           * "Cannot read properties of undefined (reading 'find')" out of
           * the betting panel. The roster arrives on game_state, which the
           * server broadcasts immediately before every phase message.
           */
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
          state.standings = message.standings ?? [];
          break;
        case 'chat_history':
          state.chatMessages = message.messages ?? [];
          break;
        case 'chat_message':
          state.chatMessages.push({
            username: message.username,
            displayName: message.displayName ?? null,
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
        case 'achievements_unlocked':
          state.achievementNotice = {
            username: message.username,
            ids: message.achievements.map((a: { id: string }) => a.id),
            names: message.achievements.map((a: { name: string }) => a.name),
          };
          break;
        case 'join_denied':
          state.joinDenied = message.reason ?? 'password_required';
          break;
        case 'kicked':
          state.kicked = true;
          state.kickedReason =
            typeof message.reason === 'string' ? message.reason : null;
          break;
        case 'lobby_terminated':
          state.terminated = true;
          break;
        case 'room_closed':
          state.roomClosed = message.reason ?? 'closed';
          break;
        /*
         * Phase 0 answers start_game, kick_player and terminate_lobby with
         * this. It used to fall through the switch unhandled, so the host
         * pressed START and the lobby sat there saying "ready to start" —
         * the screen's worst lie. Surfacing it as an error at least tells
         * the truth about what happened.
         */
        case 'not_implemented':
          state.notImplemented =
            typeof message.action === 'string' ? message.action : 'action';
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
    markGuessSubmitted: (state) => {
      if (state.phase === 'duel') state.myGuessSubmitted = true;
    },
    clearError: (state) => {
      state.error = null;
      state.notImplemented = null;
    },
    clearAchievementNotice: (state) => {
      state.achievementNotice = null;
    },
    resetGame: () => initialState,
  },
});

export const {
  serverMessage,
  selectAnswer,
  setMyBet,
  markGuessSubmitted,
  clearError,
  clearAchievementNotice,
  resetGame,
} = gameSlice.actions;
export default gameSlice.reducer;
