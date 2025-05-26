import { httpFunction } from "../../helpers/http_function";
import { getPort } from "../../helpers/port";

// helpers/handleGetUsername.ts
type Player = {
  username: string;
  health: number;
};

type UsernameInfo = {
  information: Player[];
};

export async function handleGetUsername(
  heartWrapPlayer1: HTMLDivElement,
  heartWrapPlayer2: HTMLDivElement,
  username1Els: HTMLElement[],
  username2Els: HTMLElement[],
  buttonEl: HTMLButtonElement
) {
  const port = getPort();
  const heart = document.createElement("img");
  const data = (await httpFunction(`${port}/getusernames`)) as UsernameInfo;

  heart.src = "/heart.svg";
  heart.width = 20;
  heart.height = 20;

  heartWrapPlayer1.innerHTML = ``;
  heartWrapPlayer2.innerHTML = ``;

  if (!data.information[0]) {
    username1Els.forEach(
      (el) => (el.innerText = "Waiting on the opponent to join")
    );
  } else {
    const player1 = data.information[0];
    username1Els.forEach((el) => (el.innerText = player1.username));
    for (let i = 0; i < player1.health; i++) {
      heartWrapPlayer1.appendChild(heart.cloneNode(true));
    }
  }

  if (!data.information[1]) {
    username2Els.forEach(
      (el) => (el.innerText = "Waiting on the opponent to join")
    );
  } else {
    const player2 = data.information[1];
    username2Els.forEach((el) => (el.innerText = player2.username));
    for (let i = 0; i < player2.health; i++) {
      heartWrapPlayer2.appendChild(heart.cloneNode(true));
    }
  }

  const gameData = (await httpFunction(`${port}/getGameState`)) as {
    gameState: boolean;
  };
  localStorage.setItem("gameStatus", `${gameData.gameState}`);

  if (gameData.gameState === true) {
    buttonEl.remove();
  }
}
