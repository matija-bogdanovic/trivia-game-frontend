'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { apiFetch } from '@/app/helpers/api';
import { getUsername } from '@/app/helpers/token_operations';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

function Page() {
  const { t } = useT();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
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
        const res = await apiFetch('/wallet');
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
    if (isPrivate && password.length < 4) {
      setError(t('create.passwordShort'));
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

      const res = await apiFetch('/createRoom', {
        body: {
          playerId: username,
          roomName: roomName,
          isPrivate,
          password: isPrivate ? password : undefined,
        },
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
      router.push(`/game/${data.lobbyId ?? data.roomCode}`);
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
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-4 py-2 rounded border cursor-pointer ${
                !isPrivate
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setIsPrivate(false)}
              disabled={isCreating}
            >
              {t('create.public')}
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded border cursor-pointer ${
                isPrivate
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setIsPrivate(true)}
              disabled={isCreating}
            >
              {t('create.private')}
            </button>
          </div>
          {isPrivate && (
            <Input
              type={'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('create.passwordPlaceholder')}
              className={'border border-gray-300 rounded px-2 py-1'}
              disabled={isCreating}
            />
          )}
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
