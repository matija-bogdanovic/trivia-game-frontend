import { httpFunction } from "@/app/helpers/http_function";
import { getPort } from "@/app/helpers/port";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function IndexHooks() {
  const websocketRef = useRef<WebSocket | null>(null);

  const buttonElement = useRef<HTMLButtonElement | null>(null);
  const [username, setUsername] = useState<string>("");
  const [activeUsers, setActiveUsers] = useState<string>("");
  const [alert, setAlert] = useState<string>("");
  const [error, setError] = useState("");
  const handleClick = async () => {
    if (username.length < 3) {
      setError("Name's too short.");
      return;
    } else if (username.match(/\s/)) {
      setError("Name can't contain whitespace");
      return;
    } else if (/[<>#!]/.test(username)) {
      setError("Name can't contain special characters (<,>,#,!)");
      return;
    } else {
      setError("");
      try {
        const port = getPort();
        await httpFunction(`${port}/login`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: username }),
        });
        websocketRef.current?.send(JSON.stringify({ retrieveUsers: true }));
        window.location.href = "game";
      } catch (error) {
        console.error("Something went wrong: ", error);
      }
    }
  };
  //   const tokenReference = useRef(null);

  useEffect(() => {
    const websocket = new WebSocket("ws://localhost:3000/");
    console.log(websocket);

    websocketRef.current = websocket;
    websocket.onopen = () => {
      const timeout = setTimeout(() => {
        websocket.send(JSON.stringify({ getCookie: true }));
        clearTimeout(timeout);
      }, 1000);
    };
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message);
      if (message.cookies) {
        console.log(message.cookies);
      }
      if (message.type === "retrievedUsername") {
        if (buttonElement.current) {
          buttonElement.current.disabled = true;
          buttonElement.current.style.opacity = "0.5";
          buttonElement.current.style.cursor = "not-allowed";
        }
        setAlert(
          `${
            message.username
          } you are already signed in, no need to do so again. ${(
            <Link href="">Go </Link>
          )}`
        );
      } else if (message.noCookie) {
        setAlert("");
      }
      if (message.parsedUsernames) {
        const arrayLength = message.parsedUsernames.length;
        if (arrayLength === 0) {
          setActiveUsers("No active users in the lobby currently");
        } else if (arrayLength > 0) {
          setActiveUsers(`${arrayLength} currently active player/s`);
        }
      }
    };
    return () => {
      websocket.close();
    };
  }, []);

  return {
    username,
    error,
    setUsername,
    buttonElement,
    handleClick,
    activeUsers,
    alert,
  };
}

export default IndexHooks;
