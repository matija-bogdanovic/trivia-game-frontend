import Button from "@/app/components/general/button";
import { useGame } from "@/app/components/hooks/game/context/game_context";
import { RootState } from "@/app/redux/store";
import React from "react";
import { useSelector } from "react-redux";

function StartButton() {
  const { startButton, startGameInitiator, startButtonBox } = useGame();
  const { loading } = useSelector((state: RootState) => state.roomOperations);
  const { showStartButton } = useSelector(
    (state: RootState) => state.startGame
  );

  return (
    <div className="fixed bottom-4 right-4" ref={startButtonBox}>
      {loading ? (
        <div className="flex flex-row gap-4">
          <div className="loading-circle"></div> Starting...
        </div>
      ) : (
        showStartButton && (
          <Button
            ref={startButton}
            text="Start game!"
            onClick={startGameInitiator}
          />
        )
      )}
    </div>
  );
}

export default StartButton;
