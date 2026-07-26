'use client';

import { getWebSocketUrl } from '@/app/helpers/port';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function EndScreenHooks() {
  const websocketRef = useRef<WebSocket | null>(null);
  const [winnerText, setWinnerText] = useState('Connecting to server...');
  const [connected, setConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const websocket = new WebSocket(getWebSocketUrl('/endscreen'));
    websocketRef.current = websocket;

    websocket.onopen = () => {
      setConnected(true);
      websocket.send(JSON.stringify({ getWinner: 'getWinner' }));
    };

    websocket.onmessage = (event) => {
      const parsedEvent = JSON.parse(event.data);
      if (parsedEvent?.topPlayers?.[0]) {
        setWinnerText(
          `${parsedEvent.topPlayers[0]} is the winner of this match!`
        );
      }
    };

    websocket.onclose = () => setConnected(false);

    return () => websocket.close();
  }, []);

  const playAgain = () => {
    websocketRef.current?.send(JSON.stringify({ playAgain: true }));
    router.push('/');
  };

  return {
    playAgain,
    winnerText,
    connected,
  };
}

export default EndScreenHooks;
