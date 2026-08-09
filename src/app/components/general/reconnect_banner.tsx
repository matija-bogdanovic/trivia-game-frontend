'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getIdentity } from '@/app/helpers/token_operations';
import { apiFetch } from '@/app/helpers/api';
import { useT } from '@/app/lib/i18n';

interface DroppedGame {
  lobbyId: string | null;
  code: number;
  roomName: string;
  phase: string;
}

/** nudges a player who dropped out of a running game to jump back in;
 *  re-checks whenever the tab regains focus */
function ReconnectBanner() {
  const { t } = useT();
  const router = useRouter();
  const [room, setRoom] = useState<DroppedGame | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);

  const check = useCallback(async () => {
    try {
      const id = await getIdentity();
      if (!id) {
        setRoom(null);
        return;
      }
      const res = await apiFetch('/myActiveRoom');
      if (res.ok) {
        setRoom((await res.json()).room ?? null);
      }
    } catch {
      // the nudge is best-effort
    }
  }, []);

  useEffect(() => {
    check();
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(check, 15000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [check]);

  if (!room || dismissed === room.code) return null;

  return (
    <div className="fixed top-[92px] left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white rounded shadow px-4 py-2 flex items-center gap-3 max-w-[92vw]">
      <span>⏳ {t('reconnect.text', { name: room.roomName })}</span>
      <button
        className="bg-white text-blue-700 rounded px-3 py-1 font-medium cursor-pointer"
        onClick={() => router.push(`/game/${room.lobbyId ?? room.code}`)}
      >
        {t('reconnect.button')}
      </button>
      <button
        className="font-bold cursor-pointer"
        aria-label="Dismiss"
        onClick={() => setDismissed(room.code)}
      >
        ×
      </button>
    </div>
  );
}

export default ReconnectBanner;
