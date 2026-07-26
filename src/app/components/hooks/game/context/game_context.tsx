/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { getPort, getWebSocketUrl } from '@/app/helpers/port';
import { decodeJwt, getCookie } from '@/app/helpers/token_operations';
import { usePathname, useRouter } from 'next/navigation';
import { GameContextType, Submit } from '@/app/helpers/types';
import { handleSubmit } from '../logic/handle_submit';
import { startGame } from '../logic/start_game';
import { leaveRoom } from '../logic/leave_room';
import useWebSocket from 'react-use-websocket';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/redux/store';
import { setPlayers } from '@/app/redux/slicers/player_operations';
import {
  answerCorrect,
  setLoading,
  setRoomData,
  setTokenDetails,
  setUsername,
} from '@/app/redux/slicers/room_opeations';
import loopPlayers from '../logic/loop';
import { setQuestions } from '../logic/set_question';
import { setQuestionOptionsStatus } from '@/app/redux/slicers/question_operations';
import {
  overlayFalse,
  overlayText,
  overlayTrue,
} from '@/app/redux/slicers/loop_and_overlay_slice';

const GameContext = createContext<GameContextType | null>(null);

export default function GameProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const socketUrl = useMemo(() => getWebSocketUrl(pathname), [pathname]);
  const router = useRouter();
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
  });
  const overlay = useSelector((state: RootState) => state.startGame.overlay);
  const { questionText, questionOptions, questionId, selectedOption } =
    useSelector((state: RootState) => state.questionSettings);
  const { code, username, port, decodedToken } = useSelector(
    (state: RootState) => state.roomOperations
  );
  const { loading } = useSelector((state: RootState) => state.roomOperations);
  const dispatch = useDispatch<AppDispatch>();

  const playerParent = useRef<HTMLDivElement | null>(null);
  const startButton = useRef<HTMLButtonElement | null>(null);
  const roomInfo = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startButtonBox = useRef<HTMLDivElement | null>(null);
  const questionIdReference = useRef<string | null>(null);
  const questionReference = useRef<boolean | null>(null);

  useEffect(() => {
    const code = window.location.pathname.split('/')[2];
    const cookie = getCookie('token');
    const token = decodeJwt(cookie);
    return sendJsonMessage({
      message: 'join_message',
      roomCode: Number(code),
      username: token.username,
      id: cookie,
    });
  }, []);

  useEffect(() => {
    dispatch(setTokenDetails());
    if (!lastJsonMessage || !code || !username || !port) return;

    const message = lastJsonMessage as any;
    switch (message.type) {
      case 'game_start':
        dispatch(setLoading(true));

        loopPlayers({
          playerParent,
          intervalRef,
          timeoutRef,
          dispatch,
          lastJsonMessage,
          questionIdReference,
        });
        break;
      case 'question_retrieval':
        if (questionReference.current) return;
        questionReference.current = true;
        setQuestions({ dispatch, lastJsonMessage, questionIdReference });
        break;
      case 'submit_answer':
        if ((lastJsonMessage as Submit).status) {
          const correctAnswer = (lastJsonMessage as Submit).correctAnswer;
          dispatch(setQuestionOptionsStatus({ correctAnswer }));
          const children = playerParent.current?.children;

          if (children) {
            Array.from(children).forEach((child) => {
              const span = child.querySelector('span');
              if (!span) return;

              const optionText = span.textContent;

              if (optionText === correctAnswer) {
                (child as HTMLElement).style.backgroundColor = 'green';
              } else if (optionText === selectedOption) {
                (child as HTMLElement).style.backgroundColor = 'red';
              } else {
                (child as HTMLElement).style.backgroundColor = '';
              }
            });
          }
          dispatch(answerCorrect((lastJsonMessage as Submit).status));
          dispatch(overlayTrue());
          dispatch(
            overlayText(
              `${
                (lastJsonMessage as Submit).username
              } answered correctly. Rolling onto the next player.`
            )
          );
        } else {
          const correctAnswer = (lastJsonMessage as Submit).correctAnswer;
          dispatch(setQuestionOptionsStatus({ correctAnswer }));
          async function incorrectAnswer() {
            const port = getPort();
            const token = getCookie('token');
            const usernameDecoded = decodeJwt(token);
            await fetch(`${port}/incorrectAnswer`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                roomCode: code,
                username: usernameDecoded.username,
              }),
            });
            const correctAnswer = (lastJsonMessage as any).correctAnswer;
            dispatch(setQuestionOptionsStatus({ correctAnswer }));
            sendJsonMessage({ message: '' });
          }
          const children = playerParent.current?.children;
          if (children) {
            Array.from(children).forEach((child) => {
              const span = child.querySelector('span');
              if (!span) return;

              const optionText = span.textContent;

              if (optionText === correctAnswer) {
                (child as HTMLElement).style.backgroundColor = 'green';
              } else if (optionText === selectedOption) {
                (child as HTMLElement).style.backgroundColor = 'red';
              } else {
                (child as HTMLElement).style.backgroundColor = '';
              }
            });
          }
          incorrectAnswer();
          async function updateRoom() {
            const port = getPort();
            const updatedRoom = await fetch(`${port}/getRoomDetails`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(code),
            });
            const updatedRoomData = await updatedRoom.json();
            if (updatedRoomData.roomData?.players) {
              dispatch(
                setPlayers({
                  players: (lastJsonMessage as any).players,
                  token: getCookie('token') as string,
                })
              );
            }
          }
          updateRoom();

          dispatch(
            overlayText(
              `${
                (lastJsonMessage as any).username
              } answered incorrectly. 100 points will be taken from the player.`
            )
          );
          dispatch(overlayTrue());
          const incorrect_a_timeout = setTimeout(() => {
            dispatch(overlayText(''));
            dispatch(overlayFalse());

            clearTimeout(incorrect_a_timeout);
          }, 3000);
        }
        break;
      case 'change_current_player':
        // This changes the players
        if (message.players.length === 2) {
          const children = playerParent.current!.children;
          dispatch(overlayFalse());
          dispatch(overlayText(''));

          for (let i = 0; i < children.length; i++) {
            (children[i] as HTMLElement).style.backgroundColor = '';
          }
          const currentlyAnswering = (lastJsonMessage as any).activeRound
            .currentlyAnswering;

          const opposite = Array.from(children).find(
            (e): e is HTMLDivElement => {
              return (
                e instanceof HTMLDivElement &&
                e.querySelector('h4')?.innerText !== currentlyAnswering
              );
            }
          );
          console.log(message);
          console.log(opposite);

          if (username === currentlyAnswering) {
            dispatch(overlayTrue());
          }

          dispatch(setUsername(currentlyAnswering));

          opposite!.style.backgroundColor = 'red';
        } else {
          loopPlayers({
            playerParent,
            intervalRef,
            timeoutRef,
            dispatch,
            lastJsonMessage,
            questionIdReference,
          });
        }
        break;
      case 'leave_room':
        break;
      case 'join_message':
        dispatch(
          setPlayers({
            players: (lastJsonMessage as any).players,
            token: getCookie('token') as string,
          })
        );
        dispatch(
          setRoomData({
            roomName: (lastJsonMessage as any).roomName,
            code: (lastJsonMessage as any).code,
          })
        );
        if ((lastJsonMessage as any).players.length <= 1) {
          startButton.current!.disabled = true;
          startButton.current!.style.opacity = '0.3';
        } else {
          startButton.current!.disabled = false;
          startButton.current!.style.opacity = '1';
        }
        break;
    }
  }, [lastJsonMessage, dispatch, sendJsonMessage]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = () => {
      const confirmed = window.confirm(
        'Are you sure you want to leave the page?'
      );
      if (confirmed) {
        leaveRoom();
        window.history.back();
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // useEffect(() => {
  //   const navEntry = performance.getEntriesByType(
  //     "navigation"
  //   )[0] as PerformanceNavigationTiming;
  //   const navType = navEntry?.type;

  //   const handlePageHide = (event: PageTransitionEvent) => {
  //     if (!event.persisted && navType !== "reload") {
  //       leaveRoom();
  //       sendJsonMessage({ message: "leave_room" });
  //     }
  //   };

  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === "hidden" && navType !== "reload") {
  //       leaveRoom();
  //       sendJsonMessage({ message: "leave_room" });
  //     }
  //   };

  //   window.addEventListener("pagehide", handlePageHide);
  //   document.addEventListener("visibilitychange", handleVisibilityChange);

  //   return () => {
  //     window.removeEventListener("pagehide", handlePageHide);
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //   };
  // }, [sendJsonMessage]);
  useEffect(() => {
    if (code === undefined) return;
  }, [code, decodedToken, dispatch, router, sendJsonMessage, username]);
  useEffect(() => {
    const intervalId = intervalRef.current;
    const timeoutId = timeoutRef.current;
    const countdownIntervalId = countdownIntervalRef.current;

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);
    };
  }, []);
  const onSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e, {
      selectedOption,
      questionIdReference,
      questionOptions,
      playerParent,
      intervalRef,
      timeoutRef,
      lastJsonMessage,
      decodedToken,
      sendJsonMessage,
      dispatch,
    });
  };
  const startGameInitiator = () => {
    startGame({
      loading,
      startButton,
      lastJsonMessage,
      questionIdReference,
      dispatch,
      sendJsonMessage,
    });
  };

  const value: GameContextType = {
    startGameInitiator,
    playerParent,
    startButton,
    roomInfo,
    questionOptions,
    questionText,
    intervalRef,
    timeoutRef,
    questionId,
    startButtonBox,
    overlay,
    leaveRoom,
    onSubmitHandler,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
