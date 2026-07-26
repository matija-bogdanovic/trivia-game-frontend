'use client';

import EndScreenHooks from '@/app/components/hooks/endscreen_hooks';
import React from 'react';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();

function Page() {
  const { winnerText, playAgain, connected } = EndScreenHooks();
  return (
    <div>
      <h3>{winnerText}</h3>
      <button
        onClick={playAgain}
        className={connected ? 'cursor-pointer' : 'cursor-not-allowed'}
        disabled={!connected}
      >
        Play again?
      </button>
    </div>
  );
}

export default Page;
