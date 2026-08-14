'use client';

import React, { useEffect, useRef, useState } from 'react';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { getIdentity } from '@/app/helpers/token_operations';
import { fileToDataUrl } from '@/app/helpers/avatar';
import Avatar from '@/app/components/ui/game/avatar';
import AvatarCropper from '@/app/components/ui/avatar_cropper';
import Button from '@/app/components/general/button';
import MatchHistory, {
  MatchHistoryEntry,
} from '@/app/components/ui/profile/match_history';
import { apiFetch } from '@/app/helpers/api';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

interface WalletInfo {
  credits: number;
  coins: number;
  avatar: string | null;
  wins: number;
  gamesPlayed: number;
  roundsPlayed: number;
  matchHistory: MatchHistoryEntry[];
  points: number;
  currentStreak: number;
  bestStreak: number;
  achievements: string[];
  achievementCatalog: { id: string; name: string }[];
}

function Page() {
  const { t } = useT();
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  /** original picked image, being adjusted in the crop modal */
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function load() {
      const id = await getIdentity();
      setUsername(id?.username ?? null);
      setDisplayName(id?.displayName ?? null);
      if (id) {
        try {
          const res = await apiFetch('/wallet', {
            body: { displayName: id.displayName },
          });
          if (res.ok) {
            const data: WalletInfo = await res.json();
            setWallet(data);
            setCurrentAvatar(data.avatar);
          }
        } catch {
          // wallet display is optional
        }
      }
    }
    load();
  }, []);

  const winRate =
    wallet && wallet.gamesPlayed > 0
      ? Math.round((wallet.wins / wallet.gamesPlayed) * 100)
      : 0;
  const avgRounds =
    wallet && wallet.gamesPlayed > 0
      ? Math.round((wallet.roundsPlayed / wallet.gamesPlayed) * 10) / 10
      : 0;

  /** one line about how this player plays, from their own numbers */
  const summaryLine = () => {
    if (!wallet || wallet.gamesPlayed === 0) return t('profile.noGames');
    const vars = {
      name: displayName ?? '',
      games: wallet.gamesPlayed,
      rounds: wallet.roundsPlayed,
      rate: winRate,
      best: wallet.bestStreak,
    };
    if (wallet.gamesPlayed < 5) return t('summary.rookie', vars);
    if (winRate >= 50) return t('summary.sharp', vars);
    return t('summary.regular', vars);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // allow re-picking the same file
    e.target.value = '';
    if (!file) return;
    setError('');
    setSaved(false);
    try {
      setCropSrc(await fileToDataUrl(file));
    } catch {
      setError(t('profile.badImage'));
    }
  };

  const save = async () => {
    if (!username || !preview) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await apiFetch('/avatar', { body: { image: preview } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'upload failed');
      }
      const { avatar } = await res.json();
      setCurrentAvatar(avatar);
      setPreview(null);
      setSaved(true);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      const detail =
        err instanceof Error && err.message ? ` (${err.message})` : '';
      setError(`${t('profile.uploadFailed')}${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="section">
      {cropSrc && (
        <AvatarCropper
          imageSrc={cropSrc}
          onDone={(cropped) => {
            setPreview(cropped);
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}
      <div className="container flex flex-col gap-8 pb-16">
        <div>
          <h5 className="text-gray-500">{t('profile.title')}</h5>
          <h1 className="text-[32px] font-bold">{displayName ?? ''}</h1>
        </div>

        <div className="flex flex-col gap-4 border rounded p-4 max-w-xl">
          <h3 className="font-semibold">{t('profile.avatar')}</h3>
          <div className="flex items-center gap-5">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="preview"
                className="rounded-full object-cover"
                style={{ width: 96, height: 96 }}
              />
            ) : (
              <Avatar
                name={displayName ?? '??'}
                username={username ?? undefined}
                avatar={currentAvatar}
                size={96}
              />
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFile}
              />
              <button
                className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-50 cursor-pointer self-start"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('profile.choosePhoto')}
              </button>
              <p className="text-sm text-gray-500">{t('profile.uploadHint')}</p>
            </div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <div className="flex items-center gap-3">
            <Button
              text={saving ? '…' : t('profile.save')}
              onClick={save}
              disabled={saving || !preview}
            />
            {saved && (
              <span className="text-green-600">{t('profile.saved')}</span>
            )}
          </div>
        </div>

        {wallet && (
          <div className="flex flex-col gap-2 border rounded p-4 max-w-xl">
            <h3 className="font-semibold">{t('profile.summary')}</h3>
            <p className="text-gray-600">{summaryLine()}</p>
            <div className="flex gap-6 flex-wrap pt-1">
              <span>
                {t('profile.winRate')}: <strong>{winRate}%</strong>
              </span>
              <span>
                {t('profile.games')}: <strong>{wallet.gamesPlayed}</strong>
              </span>
              <span>
                {t('profile.rounds')}: <strong>{wallet.roundsPlayed}</strong>
              </span>
              <span>
                {t('profile.avgRounds')}: <strong>{avgRounds}</strong>
              </span>
            </div>
          </div>
        )}

        {wallet && (
          <div className="flex gap-4 flex-wrap">
            <div className="border rounded p-4 min-w-[200px]">
              <h3 className="font-semibold mb-2">{t('profile.wallet')}</h3>
              <p>
                {t('profile.credits')}: <strong>{wallet.credits}</strong>
              </p>
              <p>
                {t('profile.coins')}: <strong>🪙 {wallet.coins}</strong>
              </p>
            </div>
            <div className="border rounded p-4 min-w-[200px]">
              <h3 className="font-semibold mb-2">{t('profile.stats')}</h3>
              <p>
                {t('profile.wins')}: <strong>{wallet.wins}</strong>
              </p>
              <p>
                {t('profile.games')}: <strong>{wallet.gamesPlayed}</strong>
              </p>
              <p>
                {t('profile.points')}: <strong>{wallet.points}</strong>
              </p>
              <p>
                {t('profile.streakNow')}:{' '}
                <strong>
                  {wallet.currentStreak > 0
                    ? `🔥 ${wallet.currentStreak}`
                    : wallet.currentStreak}
                </strong>
              </p>
              <p>
                {t('profile.streakBest')}: <strong>{wallet.bestStreak}</strong>
              </p>
            </div>
          </div>
        )}

        {wallet && username && (
          <MatchHistory
            history={wallet.matchHistory ?? []}
            username={username}
          />
        )}

        {wallet && (
          <div className="flex flex-col gap-3 max-w-xl">
            <h3 className="font-semibold">
              {t('profile.achievements')} ({wallet.achievements.length}/
              {wallet.achievementCatalog.length})
            </h3>
            <div className="flex flex-col gap-2">
              {wallet.achievementCatalog.map((a) => {
                const unlocked = wallet.achievements.includes(a.id);
                const translated = t(`ach.${a.id}`);
                const label =
                  translated === `ach.${a.id}` ? a.name : translated;
                return (
                  <div
                    key={a.id}
                    className={`border rounded p-3 flex items-center gap-3 ${
                      unlocked
                        ? 'border-amber-400 bg-amber-50'
                        : 'opacity-50 grayscale'
                    }`}
                  >
                    <span className="text-2xl">{unlocked ? '🏅' : '🔒'}</span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Page;
