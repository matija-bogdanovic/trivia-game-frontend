import EndScreenHooks from "@/app/components/hooks/endscreen_hooks";
import React from "react";

function Page() {
  const { winner, playAgain, websocket } = EndScreenHooks();
  return (
    <div>
      <h3 ref={winner}></h3>
      <button
        onClick={playAgain}
        className={`${
          websocket.readyState === WebSocket.CONNECTING
            ? "cursor-pointer"
            : "cursor-not-allowed"
        }`}
        disabled={websocket.readyState === WebSocket.CONNECTING ? false : true}
      >
        Play again?
      </button>
    </div>
  );
}

export default Page;
