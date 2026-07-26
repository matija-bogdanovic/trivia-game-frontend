'use client';

import { useGame } from '@/app/components/hooks/game/context/game_context';
import Button from '@/app/components/general/button';
import { useT } from '@/app/lib/i18n';
import Image from 'next/image';
import React, { useState } from 'react';

function LeaveButton() {
  const { t } = useT();
  const { leaveRoom } = useGame();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        className="fixed right-4 top-4 cursor-pointer"
        onClick={() => setConfirming(true)}
        aria-label="Leave room"
      >
        <Image
          src="/leave.svg"
          height={20}
          width={24}
          alt="leaveicon"
          className="w-auto h-auto"
        />
      </button>
      {confirming && (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.4)]"
            onClick={() => setConfirming(false)}
          ></div>
          <div className="relative flex flex-col gap-4 bg-white rounded-md p-6 z-10">
            <p>{t('game.leaveConfirm')}</p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded border border-gray-300 cursor-pointer"
                onClick={() => setConfirming(false)}
              >
                {t('game.stay')}
              </button>
              <Button text={t('game.leave')} onClick={leaveRoom} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LeaveButton;
