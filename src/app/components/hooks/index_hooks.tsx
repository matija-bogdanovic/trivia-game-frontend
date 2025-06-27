/* eslint-disable @typescript-eslint/no-unused-vars */
import { getPort } from "@/app/helpers/port";
import { getCookie } from "@/app/helpers/token_operations";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

function IndexHooks() {
  const websocketRef = useRef<WebSocket | null>(null);

  const buttonElement = useRef<HTMLButtonElement | null>(null);
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [repeatPass, setRepeatPass] = useState<string>("");
  const [activeUsers, setActiveUsers] = useState<string>("");
  const [error, setError] = useState("");
  const router = useRouter();
  const handleClick = async (e: FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError("Name's too short.");
      return;
    } else if (username.match(/\s/)) {
      setError("Name can't contain whitespace");
      return;
    } else if (/[<>#!]/.test(username)) {
      setError("Name can't contain special characters (<,>,#,!)");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email must have an @ sign and a . sign.");
      return;
    } else if (
      !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password)
    ) {
      setError(
        "Password must have 8 characters, one special character, one uppercase letter and at least one number."
      );
      return;
    } else if (password !== repeatPass) {
      setError("Passwords don't match.");
      return;
    } else {
      setError("");
      try {
        const port = getPort();
        const response = await fetch(`${port}/signup`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            mail: email,
            password: password,
          }),
        });
        websocketRef.current?.send(JSON.stringify({ retrieveUsers: true }));
        const data = await response.json();
        if (response.status === 409) {
          setError("Username or mail already taken.");
        } else if (response.status === 201) {
          router.push("/");
        }
      } catch (error) {
        console.error("Something went wrong: ", error);
      }
    }
  };
  //   const tokenReference = useRef(null);

  useEffect(() => {
    const token = getCookie("token");

    if (token) {
      router.push("/");
      alert("You're already signed in.");
      return;
    } else {
      return;
    }
  }, [router]);

  return {
    username,
    error,
    setUsername,
    buttonElement,
    handleClick,
    activeUsers,
    email,
    setEmail,
    password,
    setPassword,
    repeatPass,
    setRepeatPass,
  };
}

export default IndexHooks;
