"use client";

import { httpFunction } from "../../helpers/http_function";
import { getPort } from "../../helpers/port";

export async function handleGameStart(
  startButton: HTMLButtonElement,
  overlay: HTMLDivElement,
  countdown: string,
  setCountdown: React.Dispatch<React.SetStateAction<string>>
) {
  startButton.remove();
  let i = 3;
  overlay.style.display = "flex";
  const interval = setInterval(() => {
    i--;
    setCountdown(`You're up! ${i}`);
    if (i === 0) {
      clearInterval(interval);
      overlay.style.display = "none";
    }
  }, 1000);
}

export async function handleButtonClick(websocket: WebSocket) {
  const port = getPort();
  const startGameData = (await httpFunction(`${port}/startGame`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ gameStarted: true }),
  })) as { gameStarted: string };

  websocket.send(JSON.stringify({ gameStarted: startGameData.gameStarted }));
}
