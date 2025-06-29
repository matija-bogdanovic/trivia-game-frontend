/* eslint-disable @typescript-eslint/no-explicit-any */
import { decodeJwt, getCookie } from "@/app/helpers/token_operations";
import { AppDispatch } from "@/app/redux/store";
import {
  overlayFalse,
  overlayText,
  overlayTrue,
  showStartButton,
} from "@/app/redux/slicers/loop_and_overlay_slice";
import { setQuestions } from "./set_question";

interface LoopParams {
  playerParent: React.RefObject<HTMLDivElement | null>;
  intervalRef: React.RefObject<any | null>;
  timeoutRef: React.RefObject<any | null>;
  lastJsonMessage: any;
  questionIdReference: React.RefObject<string | null>;
  dispatch: AppDispatch;
}

export default function loopPlayers(params: LoopParams) {
  const { playerParent, timeoutRef, dispatch, lastJsonMessage,questionIdReference } = params;

  const children = playerParent.current!.children;
  let countdown = 3;
  dispatch(overlayTrue());
  dispatch(overlayText(`The game starts in ${countdown}`));
  setInterval(() => {
    countdown -= 1;
    if (countdown <= 0) {
      return;
    } else {
      dispatch(overlayText(`The game starts in ${countdown}`));
    }
  }, 1000);
  const timer = setTimeout(() => {
    dispatch(
      overlayText(
        `The game will now automatically choose between players. Hold on tight.`
      )
    );
    timeoutRef.current = setTimeout(async () => {
      dispatch(overlayFalse());
      dispatch(overlayText(""));
      console.log(lastJsonMessage)
      const selectedPlayerByName = lastJsonMessage.selected_player;
      const matchingName = Array.from(children).find(
        (e: any) => e.querySelector("h4").innerText === selectedPlayerByName
      );
      const valueCookie = getCookie("token");
      const decoded = decodeJwt(valueCookie);
      if (decoded.username !== selectedPlayerByName) {
        dispatch(overlayTrue());
      }
      (matchingName as HTMLElement).style.backgroundColor = "red";
      dispatch(showStartButton());
      setQuestions({ dispatch, lastJsonMessage, questionIdReference });
      clearTimeout(timeoutRef.current);
    }, 5000);
    clearTimeout(timer);
  }, 3000);
}
