'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getIdentity } from '@/app/helpers/token_operations';
import { apiFetch } from '@/app/helpers/api';
import { HourglassIcon } from './icons';
import { useT } from '@/app/lib/i18n';

interface DroppedGame {
  lobbyId: string | null;
  code: number;
  roomName: string;
  phase: string;
}

/**
 * Nudges a player who dropped out of a running game to jump back in;
 * re-checks whenever the tab regains focus.
 *
 * Lives in the arena shell now — it used to hang off the pre-reskin header,
 * which would have taken it with it.
 */
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
    <div
      className="fixed bottom-4 left-1/2 z-30 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-lg border border-gold/30 bg-arena-800 px-4 py-3 sm:bottom-6"
      role="status"
    >
      <span className="flex items-center gap-2 text-[12px] text-arena-100">
        <HourglassIcon className="h-4 w-4 shrink-0 text-gold" />
        {t('reconnect.text', { name: room.roomName })}
      </span>
      <button
        type="button"
        className="cursor-pointer bg-gold px-4 py-2 text-[10px] font-bold tracking-[0.15em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        onClick={() => router.push(`/game/${room.lobbyId ?? room.code}`)}
      >
        {t('reconnect.button')}
      </button>
      <button
        type="button"
        className="cursor-pointer px-1 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        aria-label={t('arena.nav.dismiss')}
        onClick={() => setDismissed(room.code)}
      >
        ×
      </button>
    </div>
  );
}

export default ReconnectBanner;
