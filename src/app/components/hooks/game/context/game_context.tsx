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
import { usePathname, useRouter } from 'next/navigation';
import { getPort, getWebSocketUrl } from '@/app/helpers/port';
import { getUsername } from '@/app/helpers/token_operations';
import { AppDispatch, RootState } from '@/app/redux/store';
import {
  markGuessSubmitted,
  resetGame,
  selectAnswer,
  serverMessage,
  setMyBet,
} from '@/app/redux/slicers/game_slice';

export interface GameActions {
  username: string | null;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  submitGuess: (value: number) => void;
  submitCode: (guess: string[]) => void;
  placeBet: (bet: 'correct' | 'wrong' | 'neutral', amount: number) => void;
  pickPlayer: (target: string) => void;
  kickPlayer: (target: string) => void;
  terminateLobby: () => void;
  sendChat: (text: string) => void;
  playAgain: () => void;
  leaveRoom: () => void;
}

const GameContext = createContext<GameActions | null>(null);

export default function GameProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const phase = useSelector((state: RootState) => state.game.phase);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const socketUrl = useMemo(() => getWebSocketUrl(pathname), [pathname]);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    getUsername().then(setUsername);
  }, []);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    socketUrl,
    {
      shouldReconnect: () => true,
    }
  );

  // join (or rejoin after a reconnect) once the socket is open and the
  // username has been resolved; the server hydrates avatar + streak
  // from the wallet
  useEffect(() => {
    if (username && readyState === ReadyState.OPEN) {
      sendJsonMessage({ type: 'join', username });
    }
  }, [username, readyState, sendJsonMessage]);

  useEffect(() => {
    if (!lastJsonMessage) return;
    dispatch(
      serverMessage({ message: lastJsonMessage, receivedAt: Date.now() })
    );
  }, [lastJsonMessage, dispatch]);

  // fresh state whenever the game screen unmounts
  useEffect(() => {
    return () => {
      dispatch(resetGame());
    };
  }, [dispatch]);

  // warn before closing the tab while a game is running
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

  const startGame = useCallback(() => {
    sendJsonMessage({ type: 'start_game' });
  }, [sendJsonMessage]);

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

  const placeBet = useCallback(
    (bet: 'correct' | 'wrong' | 'neutral', amount: number) => {
      if (bet === 'neutral') {
        dispatch(setMyBet({ kind: 'neutral' }));
        return;
      }
      dispatch(setMyBet({ kind: 'placed', bet, amount }));
      sendJsonMessage({ type: 'place_bet', bet, amount });
    },
    [dispatch, sendJsonMessage]
  );

  const pickPlayer = useCallback(
    (target: string) => {
      sendJsonMessage({ type: 'pick_player', target });
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

  const leaveRoom = useCallback(() => {
    sendJsonMessage({ type: 'leave' });
    const code = window.location.pathname.split('/')[2];
    if (username && code) {
      fetch(`${getPort()}/leaveRoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, username }),
        keepalive: true,
      }).catch(() => {});
    }
    dispatch(resetGame());
    router.push('/');
  }, [sendJsonMessage, username, dispatch, router]);

  const value = useMemo<GameActions>(
    () => ({
      username,
      startGame,
      submitAnswer,
      submitGuess,
      submitCode,
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
      startGame,
      submitAnswer,
      submitGuess,
      submitCode,
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
