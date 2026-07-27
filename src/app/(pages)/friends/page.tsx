'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { getUsername } from '@/app/helpers/token_operations';
import { getPort } from '@/app/helpers/port';
import { useT } from '@/app/lib/i18n';
import Avatar from '@/app/components/ui/game/avatar';
import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';

amplifyConfigure();

interface FriendRow {
  username: string;
  displayName: string;
  online: boolean;
  points: number;
  currentStreak: number;
  wins: number;
}

function Page() {
  const { t } = useT();
  const [username, setUsername] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  const [addName, setAddName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (name: string) => {
    const res = await fetch(`${getPort()}/friends/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name }),
    });
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends ?? []);
      setRequests(data.requests ?? []);
    }
  }, []);

  useEffect(() => {
    getUsername().then((name) => {
      setUsername(name);
      if (name) load(name).catch(console.error);
    });
  }, [load]);

  const action = async (target: string, act: string) => {
    if (!username) return;
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${getPort()}/friends/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, target, action: act }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Failed');
      } else if (act === 'request') {
        setMessage(
          data.status === 'accepted' ? t('friends.accepted') : t('friends.sent')
        );
        setAddName('');
      }
      await load(username);
    } catch {
      setError('Network error');
    }
  };

  return (
    <section className="section">
      <div className="container flex flex-col gap-6 pb-16 max-w-2xl">
        <h1 className="text-[32px] font-bold">{t('friends.title')}</h1>

        <form
          className="flex gap-2 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (addName.trim()) action(addName.trim(), 'request');
          }}
        >
          <Input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder={t('friends.placeholder')}
            className="border border-gray-300 rounded px-2 py-1"
          />
          <Button text={t('friends.add')} type="submit" />
        </form>
        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}

        {requests.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">{t('friends.requests')}</h2>
            {requests.map((name) => (
              <div
                key={name}
                className="border rounded p-3 flex items-center gap-3"
              >
                <Avatar name={name} size={36} />
                <span className="flex-1">{name}</span>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded cursor-pointer"
                  onClick={() => action(name, 'accept')}
                >
                  {t('friends.accept')}
                </button>
                <button
                  className="border px-3 py-1 rounded cursor-pointer"
                  onClick={() => action(name, 'decline')}
                >
                  {t('friends.decline')}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {friends.length === 0 ? (
            <p className="text-gray-500">{t('friends.none')}</p>
          ) : (
            friends.map((f) => (
              <div
                key={f.username}
                className="border rounded p-3 flex items-center gap-3"
              >
                <div className="relative">
                  <Avatar
                    name={f.displayName}
                    username={f.username}
                    size={40}
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      f.online ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={f.online ? t('friends.online') : t('friends.offline')}
                  ></span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate font-medium">{f.displayName}</span>
                  <span className="text-sm text-gray-500">
                    {t('home.points', { n: f.points })} ·{' '}
                    {t('home.wins', { n: f.wins })}
                    {f.currentStreak > 0 && <> · 🔥{f.currentStreak}</>}
                  </span>
                </div>
                <button
                  className="text-sm text-gray-400 hover:text-red-500 cursor-pointer"
                  onClick={() => action(f.username, 'remove')}
                >
                  {t('friends.remove')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default Page;
