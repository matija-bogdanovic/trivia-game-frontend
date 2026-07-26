'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { getPort } from '@/app/helpers/port';
import { getUsername } from '@/app/helpers/token_operations';
import { setRoomCode } from '@/app/redux/slicers/room_opeations';
import { AppDispatch, RootState } from '@/app/redux/store';
import { useRouter } from 'next/navigation';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();

function Page() {
  const { code } = useSelector((state: RootState) => state.roomOperations);
  const dispatch = useDispatch<AppDispatch>();
  const [currentlyActiveRooms, setCurrentlyActiveRooms] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const port = getPort();
  const router = useRouter();

  useEffect(() => {
    const port = getPort();
    async function getActiveRooms() {
      const response = await fetch(`${port}/getActiveRooms`);
      const responsedata = await response.json();
      setCurrentlyActiveRooms(responsedata.roundCount);
    }
    getUsername().then(setUsername);
    getActiveRooms();
  }, []);

  async function findRoom() {
    if (code.length > 13) {
      setError('Room code is too long');
      return;
    }
    if (!code.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${port}/joinRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: username,
          roomCode: code.trim(),
          username,
        }),
      });

      const data = await res.json();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (res.ok) {
        router.push(`/game/${code}`);
      } else {
        setError(data.message || 'Failed to join room');
        setLoading(false);
      }
    } catch (err) {
      console.error('Something went wrong: ', err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">Joining room...</span>
    </div>
  );
  const handleRoomCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(setRoomCode(e.target.value));
  };

  return (
    <section className="section">
      <div className="container">
        <div className="flex flex-col gap-5 w-full">
          <Input
            value={code}
            onChange={handleRoomCodeChange}
            placeholder="Enter room code"
            type={'text'}
            className={'border border-gray-300 rounded px-2 py-1'}
            maxLength={13}
          />
          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          {currentlyActiveRooms === 0 ? (
            <p className="text-gray-600">There are currently no active rooms</p>
          ) : (
            <p className="text-gray-600">
              There are {currentlyActiveRooms} currently active rooms.
            </p>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : (
            <Button text={'Join Room'} onClick={findRoom} />
          )}
        </div>
      </div>
    </section>
  );
}

export default Page;
