"use client";

import { RefObject } from "react";

type Player = {
  username: string;
  health: number;
};

type Msg = {
  props: Player[];
};

function nameUpdates(
  heartWrap1Ref: RefObject<HTMLDivElement | null>,
  heartWrap2Ref: RefObject<HTMLDivElement | null>,
  username1Refs: RefObject<HTMLElement[]>,
  username2Refs: RefObject<HTMLElement[]>,
  startButtonRef: RefObject<HTMLButtonElement | null>,
  msg: Msg
) {
  const heart = document.createElement("img");
  heart.src = "/heart.svg";
  heart.width = 20;
  heart.height = 20;

  if (heartWrap1Ref.current) {
    heartWrap1Ref.current.innerHTML = ``;
  }
  if (heartWrap2Ref.current) {
    heartWrap2Ref.current.innerHTML = ``;
  }
  console.log(msg);
  for (let i = 0; i < msg.props[0].health; i++) {
    const clone = heart.cloneNode(true);
    if (heartWrap1Ref.current) {
      heartWrap1Ref.current.appendChild(clone);
    }
  }
  username1Refs.current.forEach(
    (username) => (username.innerText = `${msg.props[0].username}`)
  );

  if (msg?.props[1] === undefined) {
    return;
  } else {
    username2Refs.current.forEach(
      (username) => (username.innerText = `${msg.props[1].username}`)
    );
    for (let i = 0; i < msg.props[1].health; i++) {
      const clone = heart.cloneNode(true);
      if (heartWrap2Ref.current) {
        heartWrap2Ref.current.appendChild(clone);
      }
    }
  }
  if (startButtonRef.current) {
    startButtonRef.current.disabled = false;
  }
}

export default nameUpdates;
