'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { getPort } from '@/app/helpers/port';
import { apiFetch } from '@/app/helpers/api';
import { getUsername } from '@/app/helpers/token_operations';
import { setRoomCode } from '@/app/redux/slicers/room_opeations';
import { AppDispatch, RootState } from '@/app/redux/store';
import { useRouter } from 'next/navigation';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

function Page() {
  const { t } = useT();
  const { code } = useSelector((state: RootState) => state.roomOperations);
  const dispatch = useDispatch<AppDispatch>();
  const [currentlyActiveRooms, setCurrentlyActiveRooms] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState('');
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
      setError(t('join.codeTooLong'));
      return;
    }
    if (!code.trim()) {
      setError(t('join.codeMissing'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/joinRoom', {
        body: {
          id: username,
          roomCode: code.trim(),
          password: needPassword ? password : undefined,
        },
      });

      const data = await res.json();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (res.ok) {
        router.push(`/game/${data.lobbyId ?? code}`);
      } else if (res.status === 401) {
        setNeedPassword(true);
        setError(t('join.passwordNeeded'));
        setLoading(false);
      } else if (res.status === 403) {
        setError(t('join.wrongPassword'));
        setLoading(false);
      } else if (res.status === 409) {
        setError(t('join.roomFull'));
        setLoading(false);
      } else {
        setError(data.message || t('join.failed'));
        setLoading(false);
      }
    } catch (err) {
      console.error('Something went wrong: ', err);
      setError(t('join.network'));
      setLoading(false);
    }
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">{t('join.joining')}</span>
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
            placeholder={t('join.placeholder')}
            type={'text'}
            className={'border border-gray-300 rounded px-2 py-1'}
            maxLength={13}
          />
          {needPassword && (
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('create.passwordPlaceholder')}
              type={'password'}
              className={'border border-gray-300 rounded px-2 py-1'}
            />
          )}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          {currentlyActiveRooms === 0 ? (
            <p className="text-gray-600">{t('join.noRooms')}</p>
          ) : (
            <p className="text-gray-600">
              {t('join.roomCount', { n: currentlyActiveRooms })}
            </p>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : (
            <Button text={t('join.button')} onClick={findRoom} />
          )}
        </div>
      </div>
    </section>
  );
}

export default Page;
