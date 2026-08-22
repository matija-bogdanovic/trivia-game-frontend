/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GamePhase =
  | 'connecting'
  | 'lobby'
  | 'countdown'
  /** the "Runda N" beat that opens each wheel cycle */
  | 'round_intro'
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
  /** the wheel's weighting for this player, as the server computes it */
  spinWeight?: number;
  /**
   * When this player went out. Absent while they are alive, and absent
   * entirely on rosters from before the server started stamping it — see
   * rankPlayers, which only uses it when both sides of a comparison have one.
   */
  eliminatedAt?: number | string | null;
  /** per-match counters the server keeps; absent before the first turn */
  stats?: {
    correct?: number;
    wrong?: number;
    betsWon?: number;
    maxBetWin?: number;
    roundsPlayed?: number;
  };
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

/**
 * One unlocked achievement, as the toast queue holds it.
 *
 * The server announces them in batches — `achievements_unlocked` carries an
 * array — but a toast shows one badge, so the batch is flattened here rather
 * than in the component. `key` identifies a single toast for dismissal; it is
 * built from the payload and the message's own receivedAt, so the reducer
 * stays a pure function of what it was given.
 */
export interface AchievementNotice {
  /** unique per toast, so dismissing one cannot dismiss another */
  key: string;
  /** who earned it — the room hears about everyone, the toast is only yours */
  username: string;
  id: string;
  /** the server's single string, "Title — how you earn it" */
  name: string;
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

/** exactly what settleBets pushes — see lambda-ws/lib/pot.mjs */
export interface BetOutcome {
  username: string;
  side: string;
  amount: number;
  quota: number;
  won: boolean;
  /** stake x quota for a winner, 0 for a loser */
  payout: number;
  /** the gain alone: amount x (quota - 1) when won, -amount when lost */
  net: number;
}

/** the price on offer, derived server-side from the answerer's accuracy */
export interface Quotas {
  correct: number;
  wrong: number;
  accuracy: number;
}

/** how a bet settled, once reveal makes the sides public */
export interface BetResult {
  username: string;
  side?: string;
  amount: number;
  quota?: number;
  won?: boolean;
  delta?: number;
}

/** the wheel, as durable state — enough to replay the animation after a reload */
export interface CurrentSpin {
  target: string;
  startedAt: number;
  endsAt: number;
}

/** who may be picked, at what price, and by which modes */
export interface PickTarget {
  username: string;
  quotas: Quotas | null;
  duelAnte: number;
}
export interface CurrentPick {
  picker: string;
  choices: string[];
  modes: string[];
  targets: PickTarget[];
  endsAt: number;
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
  /** the central pot, and how much of it has been paid out unbacked */
  pot: number;
  minted: number;
  /** minted by this turn alone, as opposed to the running total */
  mintedThisTurn: number;
  /** the server's stake floor, as it states it */
  minBet: number;
  /** how much of the winner's final balance came out of the pot */
  potAwarded: number;
  startingMoney: number;
  quotas: Quotas | null;
  betResults: BetResult[];
  currentSpin: CurrentSpin | null;
  currentPick: CurrentPick | null;
  /** 'open' when the wheel landed on them, 'challenge' when a picker aimed it */
  turnMode: 'open' | 'challenge';
  challengeBet: { username: string; amount: number; quota: number } | null;
  /** whether the answerer has already submitted, per the server */
  hasAnswered: boolean;
  /**
   * server clock minus client clock, in ms.
   *
   * Phase messages carry time REMAINING, which is immune to a skewed client;
   * game_state carries ABSOLUTE server deadlines, which is not. Holding the
   * difference lets an absolute server timestamp — currentSpin.startedAt has
   * no remaining-time twin — be placed on the client's own clock.
   */
  /** still standing at the top of the round, as the server counts it */
  playersAlive: number;
  introEndsAt: number | null;
  introDurationMs: number;
  serverSkewMs: number;
  /** absolute server-time deadline for the current phase */
  phaseEndsAt: number | null;
  picker: string | null;
  pickChoices: string[];
  pickEndsAt: number | null;
  pickDurationMs: number;
  // game over
  winner: string | null;
  totalRounds: number;
  standings: GamePlayer[];
  chatMessages: ChatMessage[];
  /**
   * Unlocked-achievement toasts still to be shown, oldest first. A queue
   * rather than a single slot: a match can end several at once, and the one
   * that arrived second is not less earned than the first.
   */
  achievementNotices: AchievementNotice[];
  // duel
  duelKind: 'guess' | 'code' | null;
  duelPlayers: string[];
  /** who has buzzed in — never what they said, which the server withholds */
  duelAnswered: string[];
  duelAnte: number;
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

/**
 * How far the client's clock sits from the server's.
 *
 * Every phase message states its deadline as time REMAINING, and the
 * game_state that precedes it states the same deadline as an ABSOLUTE server
 * timestamp. One subtraction turns that pair into the offset, which is the
 * only way to place a server timestamp that has no remaining-time twin —
 * currentSpin.startedAt — on the client's own clock.
 */
function learnSkew(
  state: GameState,
  remainingMs: unknown,
  receivedAt: number
): void {
  if (typeof remainingMs !== 'number' || state.phaseEndsAt === null) return;
  state.serverSkewMs = state.phaseEndsAt - (receivedAt + remainingMs);
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
  pot: 0,
  minted: 0,
  mintedThisTurn: 0,
  minBet: 10,
  potAwarded: 0,
  startingMoney: 500,
  quotas: null,
  betResults: [],
  currentSpin: null,
  currentPick: null,
  turnMode: 'open',
  challengeBet: null,
  hasAnswered: false,
  playersAlive: 0,
  introEndsAt: null,
  introDurationMs: 0,
  serverSkewMs: 0,
  phaseEndsAt: null,
  picker: null,
  pickChoices: [],
  pickEndsAt: null,
  pickDurationMs: 0,
  winner: null,
  totalRounds: 0,
  standings: [],
  chatMessages: [],
  achievementNotices: [],
  roomClosed: null,
  notImplemented: null,
  duelKind: null,
  duelPlayers: [],
  duelAnswered: [],
  duelAnte: 0,
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
      /*
       * Only what the server actually sends. Nine cases were removed here for
       * messages nothing has dispatched since the turn engine moved to Lambda
       * — the code-breaker duel, a client-side countdown, `picked`,
       * `lobby_terminated` — and one, `duel_question`, was the reason the duel
       * screen could never render: the server sends `duel_start`.
       *
       * `achievements_unlocked` is back, and is the exception worth naming.
       * The always-on `ws` server still broadcasts it from persistResults();
       * the serverless engine that replaced it (lambda-ws) records no game
       * result at all, so it sends nothing. The case is here because the
       * message is real protocol, not because every deployment emits it — see
       * the toast component for what that means on screen.
       */
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
          if (typeof s.pot === 'number') state.pot = s.pot;
          if (typeof s.minted === 'number') state.minted = s.minted;
          if (typeof s.startingMoney === 'number') {
            state.startingMoney = s.startingMoney;
          }
          state.quotas = s.quotas ?? null;
          state.betResults = Array.isArray(s.betResults) ? s.betResults : [];
          state.currentSpin = s.currentSpin ?? null;
          if (s.duel) {
            state.duelPlayers = s.duel.players ?? [];
            state.duelAnswered = s.duel.answered ?? [];
            state.duelAnte = Number(s.duel.ante ?? 0);
            if (s.duel.question) {
              state.questionText = s.duel.question.text ?? state.questionText;
              state.options = s.duel.question.options ?? state.options;
            }
          }
          state.currentPick = s.currentPick ?? null;

          /*
           * The absolute deadline, kept so the next phase message — which
           * carries the same deadline as time REMAINING — can be differenced
           * against it to learn how far the client's clock is from the
           * server's. See serverSkewMs.
           */
          if (typeof s.phaseEndsAt === 'number') {
            state.phaseEndsAt = s.phaseEndsAt;
          }

          if (s.turn) {
            state.answering = s.turn.answering ?? null;
            state.turnMode = s.turn.mode === 'challenge' ? 'challenge' : 'open';
            state.picker = s.turn.picker ?? null;
            state.hasAnswered = Boolean(s.turn.hasAnswered);
            if (s.turn.question) {
              state.questionText = s.turn.question.text ?? '';
              state.options = s.turn.question.options ?? [];
              state.difficulty = s.turn.question.difficulty ?? 1;
            }
          } else {
            state.hasAnswered = false;
          }
          break;
        }
        /*
         * The beat between rounds. It states its deadline both ways —
         * roundEndsAt absolute, introTimeMs remaining — so the pair teaches
         * the clock its skew without needing the preceding game_state, and
         * the countdown is built from the remaining form, which no client
         * clock can be wrong about.
         */
        case 'round_intro': {
          const remaining =
            typeof message.introTimeMs === 'number' ? message.introTimeMs : 0;
          if (typeof message.roundEndsAt === 'number') {
            state.serverSkewMs = message.roundEndsAt - (receivedAt + remaining);
            state.phaseEndsAt = message.roundEndsAt;
          }
          state.phase = 'round_intro';
          state.round = message.round ?? state.round;
          state.playersAlive = Number(message.playersAlive ?? 0);
          state.introDurationMs = remaining;
          state.introEndsAt =
            typeof message.introTimeMs === 'number'
              ? receivedAt + remaining
              : null;
          // a new round starts clean
          state.questionText = '';
          state.options = [];
          state.selectedAnswer = null;
          state.correctAnswer = null;
          state.answering = null;
          state.answerEndsAt = null;
          state.betEndsAt = null;
          state.betOutcomes = [];
          state.eliminatedNow = [];
          state.myBet = null;
          break;
        }
        case 'spin':
          learnSkew(state, message.spinTimeMs, receivedAt);
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
        /*
         * The duel the server actually sends. This reducer listened for
         * 'duel_question', which nothing has ever dispatched, so the duel
         * screen could not appear at all.
         */
        case 'duel_start':
          learnSkew(state, message.answerTimeMs, receivedAt);
          state.phase = 'duel';
          state.duelKind = 'guess';
          state.round = message.round ?? state.round;
          state.chainDepth = message.chainDepth ?? state.chainDepth;
          state.duelPlayers = message.players ?? [];
          state.duelAnswered = message.answered ?? [];
          state.duelAnte = Number(message.ante ?? 0);
          state.picker = message.picker ?? null;
          state.questionText = message.questionText ?? '';
          state.options = message.options ?? [];
          state.difficulty = message.difficulty ?? 1;
          state.selectedAnswer = null;
          state.answerDurationMs = message.answerTimeMs ?? 0;
          state.answerEndsAt = receivedAt + (message.answerTimeMs ?? 0);
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
          learnSkew(state, message.answerTimeMs, receivedAt);
          // a challenge is the same screen with a banner: who aimed it, and
          // what they staked. The SIDE stays hidden until reveal.
          state.turnMode = message.mode === 'challenge' ? 'challenge' : 'open';
          state.challengeBet = message.challengeBet ?? null;
          state.phase = 'question';
          /*
           * Floored, not assigned. A turn_question whose question is missing omits
           * difficulty and answerTimeMs as well as options, and taking them raw put
           * "difficulty undefined" on screen and NaN through the clock —
           * receivedAt + undefined is not a deadline.
           */
          state.round = message.round ?? state.round;
          state.chainDepth = message.chainDepth ?? 0;
          state.difficulty = message.difficulty ?? 1;
          state.answering = message.answering ?? null;
          state.questionText = message.questionText ?? '';
          state.options = message.options ?? [];
          state.answerDurationMs = message.answerTimeMs ?? 0;
          state.answerEndsAt =
            typeof message.answerTimeMs === 'number'
              ? receivedAt + message.answerTimeMs
              : null;
          state.selectedAnswer = null;
          state.correctAnswer = null;
          state.lastAnswer = null;
          state.lastCorrect = null;
          state.timedOut = false;
          state.myBet = null;
          state.betCount = 0;
          state.betOutcomes = [];
          state.eliminatedNow = [];
          /*
           * NOT null. A challenge IS a pick — the picker aimed this question
           * and owns the book on it — and clearing the field here threw that
           * away the moment the question arrived. The message states it, so
           * take it: null only when the wheel chose, which is when there is
           * genuinely no picker.
           */
          state.picker = message.picker ?? null;
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
          learnSkew(state, message.betTimeMs, receivedAt);
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
          state.correctAnswer = message.correctAnswer ?? null;
          state.lastAnswer = message.answer ?? null;
          state.lastCorrect = Boolean(message.correct);
          state.timedOut = Boolean(message.timedOut);
          state.answererDelta = Number(message.answererDelta ?? 0);
          state.betOutcomes = message.bets ?? [];
          state.eliminatedNow = message.eliminated ?? [];
          if (typeof message.pot === 'number') state.pot = message.pot;
          // what this turn had to mint, and the running total. The pot can go
          // negative — a payout it cannot fund is minted, never scaled down.
          state.mintedThisTurn = Number(message.minted ?? 0);
          state.minted = Number(message.mintedTotal ?? state.minted);
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
          learnSkew(state, message.pickTimeMs, receivedAt);
          state.phase = 'picking';
          state.picker = message.picker ?? null;
          state.pickChoices = message.choices ?? [];
          state.pickDurationMs = message.pickTimeMs ?? 0;
          state.pickEndsAt =
            typeof message.pickTimeMs === 'number'
              ? receivedAt + message.pickTimeMs
              : null;
          /*
           * P2.3 prices the pick: each target carries its own quotas — the
           * challenge is priced off the TARGET's accuracy, not the picker's —
           * and the ante a duel with them would cost. currentPick is the
           * durable copy on game_state; this keeps the message's in step for
           * the case where the phase message arrives without it.
           */
          if (Array.isArray(message.targets)) {
            state.currentPick = {
              picker: message.picker ?? '',
              choices: message.choices ?? [],
              modes: message.modes ?? ['challenge', 'duel'],
              targets: message.targets,
              endsAt: state.phaseEndsAt ?? 0,
            };
          }
          if (typeof message.pot === 'number') state.pot = message.pot;
          if (typeof message.minBet === 'number') state.minBet = message.minBet;
          break;
        case 'game_over':
          state.phase = 'gameover';
          state.winner = message.winner;
          state.totalRounds = message.rounds;
          state.standings = message.standings ?? [];
          break;
        /*
         * A badge was earned. Broadcast to the whole room with the username of
         * whoever earned it, so the toast filters to the signed-in player —
         * this reducer keeps every notice because it does not know who that is.
         *
         * Appended, never replaced: a match that ends three achievements at
         * once sends them in one message, and each is worth its own toast.
         * The guard is against the same badge arriving twice — a reconnect can
         * replay a broadcast — which would otherwise queue a duplicate.
         */
        case 'achievements_unlocked': {
          const earned = Array.isArray(message.achievements)
            ? message.achievements
            : [];
          for (const a of earned) {
            const id = String(a?.id ?? '');
            const username = String(message.username ?? '');
            if (!id || !username) continue;
            const seen = state.achievementNotices.some(
              (n) => n.id === id && n.username === username
            );
            if (seen) continue;
            state.achievementNotices.push({
              key: `${receivedAt}-${username}-${id}`,
              username,
              id,
              name: String(a?.name ?? id),
            });
          }
          break;
        }
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
        case 'join_denied':
          state.joinDenied = message.reason ?? 'password_required';
          break;
        case 'kicked':
          state.kicked = true;
          state.kickedReason =
            typeof message.reason === 'string' ? message.reason : null;
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
    /** one toast, by key — dismissing the front of the queue shows the next */
    dismissAchievementNotice: (state, action: PayloadAction<string>) => {
      state.achievementNotices = state.achievementNotices.filter(
        (n) => n.key !== action.payload
      );
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
  dismissAchievementNotice,
  resetGame,
} = gameSlice.actions;
export default gameSlice.reducer;
