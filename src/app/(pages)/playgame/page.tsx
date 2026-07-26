/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { getPort } from '@/app/helpers/port';
import { getUsername } from '@/app/helpers/token_operations';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

function Page() {
  const { t } = useT();
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [error, setError] = useState('');

  const loadingMessages = [
    'Creating room...',
    'Setting up game environment...',
    'Configuring room settings...',
    'Almost ready...',
    'Finalizing setup...',
  ];

  useEffect(() => {
    getUsername().then(async (name) => {
      setUsername(name);
      if (!name) return;
      try {
        const res = await fetch(`${getPort()}/wallet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name }),
        });
        if (res.ok) setCredits((await res.json()).credits);
      } catch {
        // credits display is optional
      }
    });
  }, []);

  const router = useRouter();

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  async function createRoom() {
    if (roomName.length < 4) {
      setError(t('create.tooShort'));
      return;
    }
    if (!username || !roomName || isCreating) return;

    setIsCreating(true);

    let messageIndex = 0;
    setCurrentMessage(loadingMessages[messageIndex]);

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setCurrentMessage(loadingMessages[messageIndex]);
    }, 800);

    try {
      await delay(1000);

      const port = getPort();

      const res = await fetch(`${port}/createRoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: username,
          roomName: roomName,
          createdBy: username,
        }),
      });

      const data = await res.json();

      if (res.status === 403) {
        clearInterval(messageInterval);
        setIsCreating(false);
        setCurrentMessage('');
        setCredits(data.credits ?? 0);
        const minutes = Math.ceil((data.nextCreditInMs ?? 0) / 60000);
        setError(t('create.outOfCredits', { min: minutes }));
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to create room');
      }

      if (typeof data.creditsLeft === 'number') setCredits(data.creditsLeft);
      clearInterval(messageInterval);
      router.push(`/game/${data.roomCode}`);
    } catch (error) {
      console.error(error);
      clearInterval(messageInterval);
      setIsCreating(false);
      setCurrentMessage('');
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="flex flex-col gap-4">
          {credits !== null && (
            <p className="text-gray-600">
              {t('create.credits', { n: credits })}{' '}
              <span className="text-sm text-gray-400">{t('create.cost')}</span>
            </p>
          )}
          <Input
            type={'text'}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={t('create.roomName')}
            className={'border border-gray-300 rounded px-2 py-1'}
            maxLength={13}
            disabled={isCreating}
          />
          {error && <p className="text-red-500">{error}</p>}
          <Button
            text={isCreating ? currentMessage : t('create.create')}
            onClick={createRoom}
            disabled={isCreating || credits === 0}
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
