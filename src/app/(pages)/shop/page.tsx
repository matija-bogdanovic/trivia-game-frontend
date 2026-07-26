'use client';

import React, { useEffect, useState } from 'react';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { getUsername } from '@/app/helpers/token_operations';
import { getPort } from '@/app/helpers/port';
import { useT } from '@/app/lib/i18n';

amplifyConfigure();

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  kind: 'credits' | 'avatar';
  value: string;
}

interface WalletInfo {
  credits: number;
  coins: number;
  ownedAvatars: string[];
  shop: ShopItem[];
}

function Page() {
  const { t } = useT();
  const [username, setUsername] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadWallet = async (name: string) => {
    const res = await fetch(`${getPort()}/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name }),
    });
    if (res.ok) setWallet(await res.json());
  };

  useEffect(() => {
    getUsername().then((name) => {
      setUsername(name);
      if (name) loadWallet(name).catch(console.error);
    });
  }, []);

  const buy = async (itemId: string) => {
    if (!username) return;
    setBusy(itemId);
    setError('');
    try {
      const res = await fetch(`${getPort()}/shop/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Purchase failed');
      } else {
        await loadWallet(username);
      }
    } catch {
      setError('Network error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="section">
      <div className="container flex flex-col gap-6 pb-16">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-[32px] font-bold">{t('shop.title')}</h1>
          {wallet && (
            <span className="text-lg">
              {t('shop.balance', { n: `🪙 ${wallet.coins}` })}
            </span>
          )}
        </div>
        <p className="text-gray-500">{t('shop.earn')}</p>
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {(wallet?.shop ?? []).map((item) => {
            const owned =
              item.kind === 'avatar' &&
              wallet?.ownedAvatars.includes(item.value);
            return (
              <div
                key={item.id}
                className="border rounded p-4 flex flex-col items-center gap-3"
              >
                <span className="text-4xl">
                  {item.kind === 'avatar' ? item.value : '🎟️'}
                </span>
                <span className="text-center">{item.name}</span>
                <span className="text-gray-500">🪙 {item.cost}</span>
                {owned ? (
                  <span className="text-green-600">{t('shop.owned')}</span>
                ) : (
                  <button
                    className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition cursor-pointer disabled:opacity-40"
                    disabled={busy === item.id || !wallet || wallet.coins < item.cost}
                    onClick={() => buy(item.id)}
                  >
                    {busy === item.id ? '…' : t('shop.buy')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Page;
