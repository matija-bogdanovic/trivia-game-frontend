import { useGame } from "@/app/components/hooks/game/context/game_context";
import { Player } from "@/app/components/ui/game/player_ui";
import { getCookie } from "@/app/helpers/token_operations";
import { RootState } from "@/app/redux/store";
import React from "react";
import { useSelector } from "react-redux";

function SideBar() {
  const { playerParent, roomInfo } = useGame();
  const { playerArray, playerLoading } = useSelector(
    (state: RootState) => state.playerSlicer
  );
  const { roomNameText, roomCodeText } = useSelector(
    (state: RootState) => state.roomOperations
  );
  return (
    <div className="flex flex-col gap-4">
      <aside
        ref={playerParent}
        className="border border-gray p-4 gap-4 flex flex-col flex-1 overflow-auto h-full relative"
      >
        {playerLoading ? (
          <div className="flex items-center justify-center absolute bottom-0 right-0 left-0 top-0">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading players...</span>
          </div>
        ) : (
          <>
            {playerArray.map(
              (p: { id: string; player: string; points: number }) => {
                return (
                  <Player
                    key={p.id}
                    id={p.id}
                    name={p.player}
                    isCurrentUser={p.id === getCookie("token")}
                    points={p.points}
                  />
                );
              }
            )}
          </>
        )}
      </aside>
      <div className="flex flex-col gap-4 h-auto p-4 border">
        <h4>Room information: </h4>
        <div ref={roomInfo} className="flex flex-col gap-2">
          <p>{roomCodeText}</p>
          <p>{roomNameText}</p>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
