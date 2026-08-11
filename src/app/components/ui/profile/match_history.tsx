'use client';

import React, { useState } from 'react';
import Avatar from '@/app/components/ui/game/avatar';
import { apiFetch } from '@/app/helpers/api';
import { useT } from '@/app/lib/i18n';

/** the player's own slice of a finished match, as stored in their record */
export interface MatchHistoryEntry {
  matchId: string;
  playedAt: number;
  roomName: string;
  winner: string | null;
  winnerName: string | null;
  won: boolean;
  placement: number;
  playerCount: number;
  /** how far ahead of the runner-up the winner finished */
  margin: number;
  money: number;
  roundsPlayed: number;
}

interface MatchStanding {
  username: string;
  displayName: string;
  avatar: string | null;
  placement: number;
  money: number;
  survived: boolean;
  roundsPlayed: number;
}

interface MatchDetail {
  match_id: string;
  roomName: string;
  rounds: number;
  standings: MatchStanding[];
}

function MatchHistory({
  history,
  username,
}: {
  history: MatchHistoryEntry[];
  username: string;
}) {
  const { t, lang } = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, MatchDetail>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  const formatDate = (at: number) =>
    new Date(at).toLocaleString(lang === 'sr' ? 'sr-RS' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const toggle = async (entry: MatchHistoryEntry) => {
    if (openId === entry.matchId) {
      setOpenId(null);
      return;
    }
    setOpenId(entry.matchId);
    setFailedId(null);
    // the match record is fetched once, then kept for the session
    if (details[entry.matchId]) return;
    setLoadingId(entry.matchId);
    try {
      const res = await apiFetch('/matches/detail', {
        body: { matchId: entry.matchId },
      });
      if (!res.ok) throw new Error('detail failed');
      const data = await res.json();
      setDetails((prev) => ({ ...prev, [entry.matchId]: data.match }));
    } catch {
      setFailedId(entry.matchId);
    } finally {
      setLoadingId(null);
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col gap-3 max-w-xl">
        <h3 className="font-semibold">{t('history.title')}</h3>
        <p className="text-gray-500">{t('profile.noGames')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <h3 className="font-semibold">{t('history.title')}</h3>
      <p className="text-sm text-gray-500">
        {t('history.recent', { n: history.length })}
      </p>
      <div className="flex flex-col gap-2">
        {history.map((m) => {
          const open = openId === m.matchId;
          const detail = details[m.matchId];
          return (
            <div
              key={m.matchId}
              className={`border rounded p-3 flex flex-col gap-2 ${
                m.won ? 'border-amber-400 bg-amber-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl" aria-hidden>
                  {m.won ? '🏆' : '🎯'}
                </span>
                <div className="flex flex-col flex-1 min-w-[180px]">
                  <span className="font-semibold">
                    {m.roomName}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {formatDate(m.playedAt)}
                    </span>
                  </span>
                  <span className="text-sm text-gray-600">
                    {t('history.winnerLabel')}:{' '}
                    <strong>
                      {m.won ? t('history.you') : (m.winnerName ?? '—')}
                    </strong>
                    {m.margin > 0 && (
                      <>
                        {' — '}
                        {m.won
                          ? t('history.wonByYou', { margin: m.margin })
                          : t('history.wonBy', { margin: m.margin })}
                      </>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">
                    {t('history.placement', {
                      place: m.placement,
                      total: m.playerCount,
                    })}{' '}
                    · {t('history.roundsPlayed', { n: m.roundsPlayed })} · $
                    {m.money}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded ${
                    m.won
                      ? 'bg-amber-400 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {m.won ? t('history.won') : t('history.lost')}
                </span>
                <button
                  className="text-sm underline cursor-pointer"
                  onClick={() => toggle(m)}
                  aria-expanded={open}
                >
                  {open ? t('history.hide') : t('history.details')}
                </button>
              </div>

              {open && (
                <div className="border-t pt-2">
                  {loadingId === m.matchId && (
                    <p className="text-sm text-gray-500">…</p>
                  )}
                  {failedId === m.matchId && (
                    <p className="text-sm text-red-500">
                      {t('history.detailFailed')}
                    </p>
                  )}
                  {detail && (
                    <>
                      <p className="text-sm font-semibold mb-2">
                        {t('history.standings')}
                      </p>
                      <div className="flex flex-col gap-1">
                        {detail.standings.map((s) => (
                          <div
                            key={s.username}
                            className="flex items-center gap-3 text-sm"
                          >
                            <span className="w-5 text-center text-gray-500">
                              {s.placement}.
                            </span>
                            <Avatar
                              name={s.displayName}
                              username={s.username}
                              avatar={s.avatar}
                              size={24}
                            />
                            <span className="flex-1 truncate">
                              {s.displayName}
                              {s.username === username && (
                                <span className="text-gray-500">
                                  {' '}
                                  ({t('history.you')})
                                </span>
                              )}
                            </span>
                            <span className="text-gray-500">
                              {t('history.roundsPlayed', {
                                n: s.roundsPlayed,
                              })}
                            </span>
                            <span className="text-gray-600 w-14 text-right">
                              ${s.money}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MatchHistory;
