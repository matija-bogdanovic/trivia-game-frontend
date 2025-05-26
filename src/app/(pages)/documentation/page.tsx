import React from "react";

function Page() {
  return (
    <div
      className="max-w-[1280px] w-full mx-auto 
               px-5 sm:px-20 
               pt-0 sm:pt-12 sm:pb-12"
    >
      <div>
        <h2 className="mb-4 text-2xl font-semibold">
          How do you play the game?
        </h2>
        <p className="mb-4">
          The game is made so that max player amount is 2 players per game. Each
          of the players can start the game once there are 2 players present in
          the game.
          <br />
          If any of the players disconnect from the game, the game stops and
          will wait for the next start of the game.
        </p>
        <p>
          The goal of the game is more or less reflexes, the faster one player
          clicks the dot when it becomes green, the more rounds they win.
        </p>
      </div>
    </div>
  );
}

export default Page;
