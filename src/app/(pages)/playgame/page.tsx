/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Button from "@/app/components/general/button";
import Input from "@/app/components/general/input";
import { getPort } from "@/app/helpers/port";
import { decodeJwt, getCookie } from "@/app/helpers/token_operations";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function Page() {
  const [roomName, setRoomName] = useState("");
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [error,setError] = useState("");

  const token = getCookie("token")
  const loadingMessages = [
    "Creating room...",
    "Setting up game environment...",
    "Configuring room settings...",
    "Almost ready...",
    "Finalizing setup..."
  ];

  useEffect(() => {
    const rawToken = getCookie("token");
    if (rawToken) {
      setDecodedToken(decodeJwt(rawToken));
    }
  }, []);

  const router = useRouter();

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function createRoom() {
    if (roomName.length < 4) {
      setError("Room name must be at least 4 characters long");
      return
    }
    if (!decodedToken?.username || !roomName || isCreating) return;
    
    setIsCreating(true);
    
    let messageIndex = 0;
    setCurrentMessage(loadingMessages[messageIndex]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setCurrentMessage(loadingMessages[messageIndex]);
    }, 800);

    try {
      await delay(3000);
      
      const port = getPort();
      
      const res = await fetch(`${port}/createRoom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: token,
          roomName: roomName,
          createdBy: decodedToken.username,
        }),
      });
      
      const getRoomCode = await fetch(`${port}/findRoom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: decodedToken.username,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create room");
      }
      
      const data = await getRoomCode.json();
      
      clearInterval(messageInterval);
      router.push(`/game/${data.roomCode}`);
    } catch (error) {
      console.error(error);
      clearInterval(messageInterval);
      setIsCreating(false);
      setCurrentMessage("");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="flex flex-col gap-4">
          <Input
            type={"text"}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={"Room name"}
            className={"border border-gray-300 rounded px-2 py-1"}
            maxLength={13}
            disabled={isCreating}
          />
          {error}
          <Button 
            text={isCreating ? currentMessage : "Create room"} 
            onClick={createRoom}
            disabled={isCreating}
          />
          {isCreating && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Page;