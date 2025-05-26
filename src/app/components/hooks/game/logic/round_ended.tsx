import { RefObject } from "react";

function roundEndedLogic(circle: RefObject<HTMLDivElement | null>) {
  if (circle.current) {
    const el = circle.current;
    el.style.backgroundColor = "gray";

    const newCircle = circle.current.cloneNode(true) as HTMLDivElement;
    el.replaceWith(newCircle);
    circle.current = newCircle;
  }
}

export default roundEndedLogic;
