'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { getIdentity } from '@/app/helpers/token_operations';
import { getPort } from '@/app/helpers/port';
import { useT } from '@/app/lib/i18n';
import Avatar from '@/app/components/ui/game/avatar';

amplifyConfigure();

interface LobbyPreview {
  lobbyId: string;
  code: number;
  roomName: string;
  playerCount: number;
  phase: string;
  isPrivate: boolean;
}

interface LeaderboardRow {
  username: string;
  displayName: string;
  wins: number;
  gamesPlayed: number;
  coins: number;
  points: number;
  currentStreak: number;
}

function Page() {
  const { t } = useT();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [lobbies, setLobbies] = useState<LobbyPreview[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [joining, setJoining] = useState<number | null>(null);
  const [joinError, setJoinError] = useState('');
  const [passwordFor, setPasswordFor] = useState<number | null>(null);
  const [roomPassword, setRoomPassword] = useState('');

  useEffect(() => {
    getIdentity().then((id) => {
      setUsername(id?.username ?? null);
      setDisplayName(id?.displayName ?? null);
    });
    const port = getPort();
    const load = async () => {
      try {
        const [lobbyRes, leaderRes] = await Promise.all([
          fetch(`${port}/lobbies`),
          fetch(`${port}/leaderboard`),
        ]);
        if (lobbyRes.ok) setLobbies((await lobbyRes.json()).lobbies ?? []);
        if (leaderRes.ok)
          setLeaders((await leaderRes.json()).leaderboard ?? []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    };
    load();
    const interval = setInterval(load, 10000); // keep previews fresh
    return () => clearInterval(interval);
  }, []);

  const joinLobby = async (lobby: LobbyPreview) => {
    if (!username || joining) return;
    // private rooms open a password field first
    if (lobby.isPrivate && passwordFor !== lobby.code) {
      setPasswordFor(lobby.code);
      setRoomPassword('');
      setJoinError('');
      return;
    }
    setJoining(lobby.code);
    setJoinError('');
    try {
      const res = await fetch(`${getPort()}/joinRoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: username,
          roomCode: lobby.code,
          username,
          password: lobby.isPrivate ? roomPassword : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/game/${data.lobbyId ?? lobby.code}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const message =
        data.message === 'password_required'
          ? t('join.passwordNeeded')
          : data.message === 'wrong_password'
            ? t('join.wrongPassword')
            : (data.message ?? t('home.joinFailed'));
      setJoinError(message);
      // the lobby may have vanished — refresh the list right away
      try {
        const lobbyRes = await fetch(`${getPort()}/lobbies`);
        if (lobbyRes.ok) setLobbies((await lobbyRes.json()).lobbies ?? []);
      } catch {
        // list refresh is best-effort
      }
    } catch (err) {
      console.error('Join failed:', err);
      setJoinError(t('join.network'));
    }
    setJoining(null);
  };

  return (
    <section className="section">
      <div className="container flex flex-col gap-8 pb-16">
        <p className="text-xl">
          {username
            ? t('home.hello', { name: displayName ?? username })
            : t('home.noToken')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold">{t('home.lobbies')}</h2>
            {!username && (
              <p className="text-sm text-gray-500">{t('home.signInToJoin')}</p>
            )}
            {joinError && <p className="text-red-500">{joinError}</p>}
            {lobbies.length === 0 ? (
              <p className="text-gray-500">{t('home.noLobbies')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {lobbies.map((lobby) => (
                  <div
                    key={lobby.code}
                    className="border rounded p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col">
                      <strong>
                        {lobby.isPrivate ? '🔒' : '🌐'} {lobby.roomName}
                      </strong>
                      <span className="text-sm text-gray-500">
                        #{lobby.code} ·{' '}
                        {t('home.players', { n: lobby.playerCount })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordFor === lobby.code && (
                        <input
                          type="password"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                          placeholder={t('create.passwordPlaceholder')}
                          className="border border-gray-300 rounded px-2 py-1 w-36"
                          autoFocus
                        />
                      )}
                      <button
                        className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition cursor-pointer disabled:opacity-40"
                        disabled={joining !== null || !username}
                        onClick={() => joinLobby(lobby)}
                      >
                        {joining === lobby.code ? '…' : t('home.join')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold">{t('home.leaderboard')}</h2>
            {leaders.length === 0 ? (
              <p className="text-gray-500">{t('home.noLeaders')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {leaders.slice(0, 10).map((row, i) => (
                  <div
                    key={row.username}
                    className="border rounded p-2 flex items-center gap-3"
                  >
                    <span className="w-6 text-center font-semibold">
                      {i + 1}.
                    </span>
                    <Avatar
                      name={row.displayName}
                      username={row.username}
                      size={32}
                    />
                    <span className="flex-1 truncate">
                      {row.displayName}
                      {row.currentStreak > 0 && (
                        <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                          🔥{row.currentStreak}
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-gray-500 text-right">
                      <strong className="text-gray-800">
                        {t('home.points', { n: row.points })}
                      </strong>
                      <br />
                      {t('home.wins', { n: row.wins })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Page;
