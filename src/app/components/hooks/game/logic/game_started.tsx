import { RefObject } from "react";
import { handleRoundStartWrap } from "../../../server_operations/handle_round_start";

function gameStartedLogic(
  roundCount: RefObject<HTMLHeadingElement | null>,
  msg: { roundCount: string; randomNumber: number },
  circle: RefObject<HTMLHeadingElement | null>,
  overlay: RefObject<HTMLDivElement | null>,
  setRoundcountdown: React.Dispatch<React.SetStateAction<string>>,
  websocket: WebSocket,
  startButtonRef: RefObject<HTMLButtonElement | null>
) {
  if (roundCount.current) {
    roundCount.current.innerText = msg.roundCount;
  }

  const preDelay = 2000;
  const delay: number = msg.randomNumber || 1000;
  if (circle.current) {
    circle.current.style.cursor = "not-allowed";
  }
  if (overlay.current) {
    overlay.current.style.display = "flex";
  }
  setRoundcountdown(`${msg.roundCount} begins soon!`);

  setTimeout(() => {
    if (overlay.current) {
      overlay.current.style.display = "none";
    }
    if (overlay.current && circle.current) {
      handleRoundStartWrap(
        msg.roundCount,
        delay,
        overlay.current,
        circle.current,
        websocket
      );
    }
  }, preDelay);
  if (startButtonRef.current) {
    startButtonRef.current.remove();
  }
  console.log(startButtonRef.current);
  return {};
}

export default gameStartedLogic;
