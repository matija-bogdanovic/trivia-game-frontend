import { httpFunction } from "../../helpers/http_function";
import { getPort } from "../../helpers/port";

export async function handleRoundStartWrap(
  roundName: string,
  delay: number,
  overlay: HTMLDivElement,
  circle: HTMLDivElement,
  websocket: WebSocket
) {
  const port = getPort();
  setTimeout(() => {
    overlay.style.display = "none";
    circle.style.backgroundColor = "#00FF00";
    circle.style.cursor = "pointer";

    const onClick = async () => {
      circle.removeEventListener("click", onClick);

      circle.style.cursor = "not-allowed";
      circle.style.backgroundColor = "gray";

      try {
        await httpFunction(`${port}/pressedCircle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ round: roundName }),
        });

        websocket.send(JSON.stringify({ roundEnded: true }));
      } catch (err) {
        console.error("HTTP ERROR:", err);
      }
    };

    circle.addEventListener("click", onClick);
  }, delay);
}
