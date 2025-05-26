"use client";

import IndexHooks from "@/app/components/hooks/index_hooks";
import Link from "next/link";

export default function Home() {
  const {
    username,
    setUsername,
    error,
    buttonElement,
    handleClick,
    activeUsers,
    alert,
  } = IndexHooks();

  return (
    <div className="flex flex-col gap-3 justify-center items-center w-screen h-screen">
      {alert === "" ? <></> : <p>{alert}</p>}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Give yourself a name"
        className="border border-gray-300 rounded px-2 py-1"
      />
      <div className="flex justify-center items-center flex-col gap-2">
        <p>{activeUsers}</p>
        <p>{error}</p>
      </div>
      <button
        ref={buttonElement}
        onClick={handleClick}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Connect&#x21;
      </button>
      <div className="flex flex-col gap-2 justify-center items-center">
        <span className="text-xs">
          ©WhoIsFaster by Matija Bogdanovic&#x2e; All rights reserved&#x2e;
        </span>
        <span className="text-xs">
          If it&apos;s your first time playing the game make sure to check out
          the{" "}
          <Link
            href="/documentation"
            className="underline text-blue-600 hover:text-blue-800"
          >
            documentation
          </Link>
          &#x2e;
        </span>
      </div>
    </div>
  );
}
