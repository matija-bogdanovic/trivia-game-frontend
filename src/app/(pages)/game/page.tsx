"use client";

import React from "react";
import GameHooks from "@/app/components/hooks/game/game_hooks";

function Page() {
  const {
    overlay,
    roundCountdown,
    username1Refs,
    heartWrap1Ref,
    heartWrap2Ref,
    username2Refs,
    roundCount,
    circle,
    startButtonRef,
    startButtonClick,
  } = GameHooks();

  return (
    <div>
      <div
        ref={overlay}
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 hidden flex-col items-center justify-center z-20"
      >
        <h3 className="text-white">{roundCountdown}</h3>
      </div>

      <div className="absolute left-0 right-0 top-5 flex flex-col items-center">
        <div className="flex flex-col gap-2 justify-center items-center w-auto">
          <h3>DUEL</h3>
          <div className="flex justify-center items-center gap-2 w-[316px]">
            <div className="flex justify-center flex-col items-end gap-2">
              <h4
                ref={(el) => {
                  if (el) username1Refs.current.push(el);
                }}
              ></h4>
              <div
                ref={heartWrap1Ref}
                className="flex flex-row gap-2 justify-end"
              ></div>
            </div>

            <span>VS</span>

            <div className="flex justify-center flex-col items-start gap-2">
              <h4
                ref={(el) => {
                  if (el) username2Refs.current.push(el);
                }}
              ></h4>
              <div ref={heartWrap2Ref} className="flex flex-row gap-2"></div>
            </div>
          </div>
          <h5 ref={roundCount}>Rounds starting soon...</h5>
        </div>
      </div>

      <div className="w-full h-screen flex justify-between items-center">
        <span
          className="ml-5"
          ref={(el) => {
            if (el) username1Refs.current.push(el);
          }}
        ></span>

        <div className="fixed left-1/2 right-1/2 flex flex-col justify-center items-center">
          <div
            ref={circle}
            className="bg-gray-500 h-12 rounded-full min-w-[50px]"
          ></div>
        </div>

        <span
          className="mr-5"
          ref={(el) => {
            if (el) username2Refs.current.push(el);
          }}
        ></span>

        <div className="w-full fixed bottom-0 left-0 right-0 flex flex-row justify-center pt-5 pb-5">
          <button
            ref={startButtonRef}
            onClick={startButtonClick}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition `}
          >
            Start
          </button>
        </div>
      </div>

      <div className="flex flex-row fixed bottom-1 left-1">
        <h5>Don&apos;t refresh the page for best experience.</h5>
      </div>
    </div>
  );
}

export default Page;
