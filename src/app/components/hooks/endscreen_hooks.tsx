'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

function EndScreenHooks() {
  const winner = useRef<HTMLHeadingElement>(null);
  const websocket = new WebSocket(`ws://localhost:3001/endscreen`);
  const router = useRouter();
  const playAgain = () => {
    websocket.send(JSON.stringify({ playAgain: true }));
    router.push('/');
  };
  useEffect(() => {
    if (websocket.readyState === WebSocket.CONNECTING) {
      if (winner.current) {
        winner.current.innerText = 'Connecting to server...';
      }
    }

    websocket.onopen = () => {
      websocket.send(JSON.stringify({ getWinner: 'getWinner' }));

      websocket.onmessage = (event) => {
        const parsedEvent = JSON.parse(event.data);
        if (parsedEvent)
          if (winner.current) {
            winner.current.innerText = `${parsedEvent.topPlayers[0]} is the winner of this match!`;
          }
      };
    };
  });
  return {
    playAgain,
    winner,
    websocket,
  };
}

export default EndScreenHooks;
