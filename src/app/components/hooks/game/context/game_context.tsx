'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { getSocketUrl } from '@/app/helpers/port';
import { getIdentity } from '@/app/helpers/token_operations';
import { apiFetch, getAccessToken } from '@/app/helpers/api';
import { AppDispatch, RootState } from '@/app/redux/store';
import {
  markGuessSubmitted,
  resetGame,
  selectAnswer,
  serverMessage,
  setMyBet,
} from '@/app/redux/slicers/game_slice';
import { useT } from '@/app/lib/i18n';

export interface GameActions {
  username: string | null;
  displayName: string | null;
  /**
   * Whether this player is the room's Admin. It decides whether leaving needs
   * a warning, so it lives here rather than being recomputed by each screen
   * that offers a Leave button.
   */
  isHost: boolean;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  submitGuess: (value: number) => void;
  submitCode: (guess: string[]) => void;
  joinWithPassword: (password: string) => void;
  placeBet: (
    side: 'correct' | 'wrong' | 'neutral',
    amount: number,
    allIn?: boolean
  ) => void;
  pickPlayer: (
    target: string,
    mode?: 'challenge' | 'duel',
    wager?: { side: 'correct' | 'wrong'; amount: number | 'all' }
  ) => void;
  kickPlayer: (target: string) => void;
  terminateLobby: () => void;
  sendChat: (text: string) => void;
  playAgain: () => void;
  leaveRoom: () => void | Promise<void>;
}

const GameContext = createContext<GameActions | null>(null);

export default function GameProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * The lobby this provider is for. It used to ride in the socket path; API
   * Gateway drops the path, so it is read from the route here and sent in the
   * join message instead. The route is /game/[game].
   */
  const params = useParams<{ game?: string | string[] }>();
  const lobbyId = Array.isArray(params?.game) ? params.game[0] : params?.game;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  // LanguageProvider sits above GameProvider in the root layout, so this is
  // always inside it — the value is what the join message carries as `lang`
  const { lang } = useT();
  const phase = useSelector((state: RootState) => state.game.phase);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // the bare host — no lobby id in the path, see getSocketUrl()
  const socketUrl = useMemo(() => getSocketUrl(), []);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  /** password for private rooms, kept for reconnect re-joins */
  const passwordRef = useRef<string | null>(null);
  const roomCode = useSelector((state: RootState) => state.game.code);
  const players = useSelector((state: RootState) => state.game.players);
  const isHost = useMemo(
    () => players.find((p) => p.username === username)?.isHost ?? false,
    [players, username]
  );

  useEffect(() => {
    getIdentity().then((id) => {
      setUsername(id?.username ?? null);
      setDisplayName(id?.displayName ?? null);
    });
  }, []);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    socketUrl,
    {
      shouldReconnect: () => true,
    }
  );

  /**
   * The join message carries everything the server needs to place this socket:
   * which lobby, and who is asking.
   *
   * The token has to be fresh — the server verifies it against the pool, and
   * Amplify refreshes it behind getAccessToken(), which matters on a long game
   * or after a reconnect. displayName stays cosmetic; identity comes from the
   * token. The lobby id is here rather than in the URL because an API Gateway
   * WebSocket API has no path routing.
   */
  const sendJoin = useCallback(
    async (password?: string) => {
      if (!lobbyId) return;
      const token = await getAccessToken();
      if (!token) return;
      sendJsonMessage({
        type: 'join',
        lobbyId,
        token,
        displayName,
        /*
         * The language the player is reading the app in. The server counts
         * these across everyone seated and picks ONE language for the match —
         * a question is shown to the whole table, so it cannot be per-player.
         * Sent on every join, reconnects included, so a language changed
         * between matches is picked up at the next start.
         */
        lang,
        password: password ?? passwordRef.current ?? undefined,
      });
    },
    [lobbyId, displayName, lang, sendJsonMessage]
  );

  /*
   * Join once the socket is open and the identity has resolved — and re-join
   * on every reconnect. That is not belt-and-braces: a serverless socket keeps
   * no per-connection memory, so a reconnected socket is an anonymous one
   * until it says who it is again. readyState flipping back to OPEN is what
   * re-fires this.
   */
  useEffect(() => {
    if (username && readyState === ReadyState.OPEN) {
      void sendJoin();
    }
  }, [username, readyState, sendJoin]);

  const joinWithPassword = useCallback(
    (password: string) => {
      passwordRef.current = password;
      void sendJoin(password);
    },
    [sendJoin]
  );

  useEffect(() => {
    if (!lastJsonMessage) return;
    dispatch(
      serverMessage({ message: lastJsonMessage, receivedAt: Date.now() })
    );
  }, [lastJsonMessage, dispatch]);

  /*
   * A REFRESH IS A RECONNECT, NEVER A DEPARTURE.
   *
   * Nothing here may send `leave` — not this cleanup, not an unload handler.
   * Only two things end membership: the Leave button (which warns the host
   * first, because their leaving deletes the room) and being kicked. A reload,
   * a backgrounded tab and a dropped connection all just close the socket,
   * which the server treats as $disconnect: it reaps the Connections row and
   * leaves the Lobbies roster untouched, so the player keeps their seat and
   * the host keeps the room. Sending `leave` on unload would hand the server
   * the one message that does tear the room down, and a host who pressed F5
   * would take everybody else's game with them.
   *
   * This cleanup therefore resets local Redux state only, and is safe because
   * the next mount rejoins from the route's lobbyId and a fresh token.
   */
  useEffect(() => {
    return () => {
      dispatch(resetGame());
    };
  }, [dispatch]);

  /*
   * A browser confirm, not a departure — it sends nothing. It exists so a
   * stray Cmd-R mid-question is a deliberate choice; the server resyncs the
   * in-flight phase on rejoin either way, so refreshing is safe, just
   * disruptive to whoever is answering.
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const p = phaseRef.current;
      if (p !== 'connecting' && p !== 'lobby' && p !== 'gameover') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  /*
   * Only the host starts the match. The server enforces this too, so this is
   * not the guard that matters — it is here so a stray call from some future
   * screen cannot send a message the server will only reject, and so the rule
   * lives next to the isHost that every start control reads.
   */
  const startGame = useCallback(() => {
    if (!isHost) return;
    sendJsonMessage({ type: 'start_game' });
  }, [isHost, sendJsonMessage]);

  const submitAnswer = useCallback(
    (answer: string) => {
      dispatch(selectAnswer(answer));
      sendJsonMessage({ type: 'submit_answer', answer });
    },
    [dispatch, sendJsonMessage]
  );

  const submitGuess = useCallback(
    (value: number) => {
      dispatch(markGuessSubmitted());
      sendJsonMessage({ type: 'submit_guess', value });
    },
    [dispatch, sendJsonMessage]
  );

  const submitCode = useCallback(
    (guess: string[]) => {
      sendJsonMessage({ type: 'submit_code', guess });
    },
    [sendJsonMessage]
  );

  /**
   * Declare on this turn: a side with a stake, or neutral.
   *
   * Neutral used to be swallowed here — it set the local flag and returned
   * without telling anybody. The server counts abstaining as a declaration and
   * closes the betting pause early once everyone has made one, so a player who
   * sat out was silently holding the pause open for the whole clock.
   *
   * `side` is what the handler reads first (`msg.side ?? msg.bet`); allIn is
   * sent as a flag rather than an amount so the server stakes the money it
   * knows the player has, not the figure this client last saw.
   */
  const placeBet = useCallback(
    (side: 'correct' | 'wrong' | 'neutral', amount: number, allIn = false) => {
      if (side === 'neutral') {
        dispatch(setMyBet({ kind: 'neutral' }));
        sendJsonMessage({ type: 'place_bet', side, amount: 0 });
        return;
      }
      dispatch(setMyBet({ kind: 'placed', bet: side, amount }));
      sendJsonMessage({ type: 'place_bet', side, amount, allIn });
    },
    [dispatch, sendJsonMessage]
  );

  /**
   * Choose who answers next, and how.
   *
   * A challenge may carry a wager, priced off the TARGET's accuracy and
   * committed blind — the question is drawn in the same server mutation, so
   * nobody has seen it, picker included. A duel ignores side and amount: its
   * price is the fixed symmetric ante, not something the picker sizes.
   */
  const pickPlayer = useCallback(
    (
      target: string,
      mode: 'challenge' | 'duel' = 'challenge',
      wager?: { side: 'correct' | 'wrong'; amount: number | 'all' }
    ) => {
      sendJsonMessage({
        type: 'pick_player',
        target,
        mode,
        ...(mode === 'challenge' && wager
          ? { side: wager.side, amount: wager.amount }
          : {}),
      });
    },
    [sendJsonMessage]
  );

  const kickPlayer = useCallback(
    (target: string) => {
      sendJsonMessage({ type: 'kick_player', target });
    },
    [sendJsonMessage]
  );

  const terminateLobby = useCallback(() => {
    sendJsonMessage({ type: 'terminate_lobby' });
  }, [sendJsonMessage]);

  const sendChat = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed) sendJsonMessage({ type: 'chat', text: trimmed });
    },
    [sendJsonMessage]
  );

  const playAgain = useCallback(() => {
    sendJsonMessage({ type: 'play_again' });
  }, [sendJsonMessage]);

  /**
   * Leave, and land somewhere useful.
   *
   * Both halves are needed and neither can do the other's job. The WS `leave`
   * is what notifies the room — when the leaver is the host the server closes
   * the room and broadcasts room_closed from there, because the REST Lambda
   * cannot post to a socket on a different API. The REST call is what makes
   * the departure durable in the Lobbies item.
   *
   * The REST call is awaited before navigating. It used to be fire-and-forget
   * next to a synchronous router.push, which unmounts this provider and closes
   * the socket — a host could leave, the frame could die with the socket, and
   * the room would outlive them. Awaiting gives the frame time to flush and
   * guarantees the durable delete landed; a failure still navigates, since
   * trapping someone in a room they asked to leave is the worse outcome.
   */
  const leaveRoom = useCallback(async () => {
    sendJsonMessage({ type: 'leave' });
    // the URL carries the lobby id; the REST cleanup wants the numeric code
    if (username && roomCode !== null) {
      await apiFetch('/leaveRoom', { body: { code: roomCode } }).catch(
        () => {}
      );
    }
    dispatch(resetGame());
    // the rooms list, not the dashboard: someone who just left a room is
    // most likely looking for another one
    router.push('/rooms');
  }, [sendJsonMessage, username, roomCode, dispatch, router]);

  const value = useMemo<GameActions>(
    () => ({
      username,
      displayName,
      isHost,
      startGame,
      submitAnswer,
      submitGuess,
      submitCode,
      joinWithPassword,
      placeBet,
      pickPlayer,
      kickPlayer,
      terminateLobby,
      sendChat,
      playAgain,
      leaveRoom,
    }),
    [
      username,
      displayName,
      isHost,
      startGame,
      submitAnswer,
      submitGuess,
      submitCode,
      joinWithPassword,
      placeBet,
      pickPlayer,
      kickPlayer,
      terminateLobby,
      sendChat,
      playAgain,
      leaveRoom,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
