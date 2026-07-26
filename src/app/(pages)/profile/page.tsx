'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { getUsername } from '@/app/helpers/token_operations';
import {
  AVATAR_HUES,
  decodeAvatar,
  encodeAvatar,
  FREE_AVATARS,
  getMyAvatar,
  saveMyAvatar,
} from '@/app/helpers/avatar';
import Avatar from '@/app/components/ui/game/avatar';
import Button from '@/app/components/general/button';
import { getPort } from '@/app/helpers/port';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

interface WalletInfo {
  credits: number;
  coins: number;
  ownedAvatars: string[];
  wins: number;
  gamesPlayed: number;
}

function Page() {
  const { t } = useT();
  const [username, setUsername] = useState<string | null>(null);
  const [emoji, setEmoji] = useState<string>(FREE_AVATARS[0]);
  const [hue, setHue] = useState<number>(AVATAR_HUES[4]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const name = await getUsername();
      setUsername(name);
      const avatar = decodeAvatar(await getMyAvatar());
      if (avatar) {
        setEmoji(avatar.emoji);
        setHue(avatar.hue);
      }
      if (name) {
        try {
          const res = await fetch(`${getPort()}/wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name }),
          });
          if (res.ok) setWallet(await res.json());
        } catch {
          // wallet display is optional
        }
      }
    }
    load();
  }, []);

  const availableEmojis = [...FREE_AVATARS, ...(wallet?.ownedAvatars ?? [])];

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveMyAvatar(encodeAvatar(emoji, hue));
      setSaved(true);
    } catch (err) {
      console.error('Failed to save avatar:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="section">
      <div className="container flex flex-col gap-8 pb-16">
        <div>
          <h5 className="text-gray-500">{t('profile.title')}</h5>
          <h1 className="text-[32px] font-bold">{username ?? ''}</h1>
        </div>

        <div className="flex flex-col gap-4 border rounded p-4 max-w-xl">
          <h3 className="font-semibold">{t('profile.avatar')}</h3>
          <div className="flex items-center gap-4">
            <Avatar
              name={username ?? '??'}
              avatar={encodeAvatar(emoji, hue)}
              size={80}
            />
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {t('profile.emoji')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableEmojis.map((e) => (
                    <button
                      key={e}
                      className={`text-2xl p-1 rounded cursor-pointer ${
                        e === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setEmoji(e)}
                    >
                      {e}
                    </button>
                  ))}
                  <Link
                    href="/shop"
                    className="text-2xl p-1 opacity-50"
                    title={t('profile.locked')}
                  >
                    🔒
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {t('profile.color')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_HUES.map((h) => (
                    <button
                      key={h}
                      className={`w-8 h-8 rounded-full cursor-pointer ${
                        h === hue ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: `hsl(${h} 65% 45%)` }}
                      onClick={() => setHue(h)}
                      aria-label={`hue ${h}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              text={saving ? '…' : t('profile.save')}
              onClick={save}
              disabled={saving}
            />
            {saved && (
              <span className="text-green-600">{t('profile.saved')}</span>
            )}
          </div>
        </div>

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
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Page;
