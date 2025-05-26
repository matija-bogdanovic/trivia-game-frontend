import { useEffect, useRef, useState } from "react";
import {
  handleButtonClick,
  handleGameStart,
} from "../../server_operations/handle_game_start";
import { getPort } from "@/app/helpers/port";
import { httpFunction } from "@/app/helpers/http_function";
import { handleGetUsername } from "../../server_operations/handle_get_username";
import gameStartedLogic from "./logic/game_started";
import roundEndedLogic from "./logic/round_ended";
import nameUpdates from "./logic/name_updates";

function GameHooks() {
  const heartWrap1Ref = useRef<HTMLDivElement>(null);
  const heartWrap2Ref = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const username1Refs = useRef<HTMLElement[]>([]);
  const username2Refs = useRef<HTMLElement[]>([]);
  const overlay = useRef<HTMLDivElement>(null);
  const circle = useRef<HTMLDivElement>(null);
  const roundCount = useRef<HTMLHeadingElement>(null);
  const [roundCountdown, setRoundcountdown] = useState("");

  const websocket = new WebSocket("ws://localhost:3000/game");
  const startButtonClick = () => {
    handleButtonClick(websocket);
  };
  useEffect(() => {
    const port = getPort();
    websocket.onopen = async () => {
      const startStatus = (await httpFunction(`${port}/getGameState`)) as {
        gameState: boolean;
      };
      const numberOfPlayers = (await httpFunction(`${port}/playerNum`)) as {
        usernames: string[];
      };
      websocket.send(JSON.stringify({ joined: true, username: document.cookie }));
      try {
        if (numberOfPlayers.usernames.length < 2) {
          if (startButtonRef.current) {
            (startButtonRef.current as HTMLButtonElement).disabled = true;
          }
        }
        if (
          heartWrap1Ref.current &&
          heartWrap2Ref.current &&
          startButtonRef.current
        ) {
          handleGetUsername(
            heartWrap1Ref.current,
            heartWrap2Ref.current,
            username1Refs.current,
            username2Refs.current,
            startButtonRef.current
          );
        }
        if (startStatus.gameState) {
          websocket.send(JSON.stringify({ gameRound: "getGameRound" }));
        }
      } catch (err) {
        console.error("Error during WebSocket open logic:", err);
      }
    };
    websocket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg?.gameStarted) {
        gameStartedLogic(
          roundCount,
          msg,
          circle,
          overlay,
          setRoundcountdown,
          websocket,
          startButtonRef
        );
      }
      if (msg?.roundEnded) {
        roundEndedLogic(overlay);
      }

      if (msg?.type === "updatedNames") {
        nameUpdates(
          heartWrap1Ref,
          heartWrap2Ref,
          username1Refs,
          username2Refs,
          startButtonRef,
          msg
        );
      }

      if (msg?.matchEnd) {
        window.location.href = "endscreen";
      }

      if (msg.started) {
        if (startButtonRef.current && overlay.current) {
          handleGameStart(
            startButtonRef.current,
            overlay.current,
            roundCountdown,
            setRoundcountdown
          );
        }
      }
    };
    websocket.onclose = (event) => {
      console.log("Disconnected successfully", event)
    };
    websocket.onerror = () => {
      if (overlay.current) {
        overlay.current.style.display = "flex";
      }
      setRoundcountdown("Uh oh, something went wrong!");
    };
  });
  return {
    startButtonClick,
    heartWrap1Ref,
    heartWrap2Ref,
    startButtonRef,
    overlay,
    circle,
    roundCount,
    roundCountdown,
    username1Refs,
    username2Refs,
  };
}

export default GameHooks;
