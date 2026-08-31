'use client';

import { useEffect, useState } from 'react';
import Modal from './modal';
import { usePasswordReveal } from './password_reveal';
import { useT } from '@/app/lib/i18n';

/**
 * The private-room password prompt.
 *
 * One component for every path that can meet a locked room — the room list,
 * the code entry, and the game socket — so the same lock always asks the same
 * way. It is deliberately NOT the sign-in case: a room that wants a password
 * and a session that has expired are different problems with different
 * remedies, and the earlier work conflated them.
 *
 * The error lives inside the dialog because that is where the retry is. A
 * wrong password used to close the prompt and print a line on the page behind
 * it, which reads as failure rather than as "try again".
 */
export default function PasswordPrompt({
  open,
  roomName,
  error,
  submitting = false,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  /** shown when the caller knows which room is locked */
  roomName?: string | null;
  /** a message from the last attempt, rendered in the dialog */
  error?: string | null;
  submitting?: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const [password, setPassword] = useState('');
  const reveal = usePasswordReveal('room-password-prompt');

  // a fresh prompt starts empty, including after a cancel and reopen
  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  return (
    <Modal open={open} title={t('arena.join.lockedTitle')} onClose={onCancel}>
      <p className="text-sm text-arena-100">
        {roomName
          ? t('arena.join.lockedNamed', { name: roomName })
          : t('arena.join.lockedPlain')}
      </p>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (password && !submitting) onSubmit(password);
        }}
      >
        <div className="relative">
          <input
            id="room-password-prompt"
            type={reveal.type}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('arena.join.password')}
            aria-label={t('arena.join.password')}
            aria-invalid={Boolean(error)}
            autoComplete="off"
            disabled={submitting}
            className="w-full rounded-lg border border-white/10 bg-arena-750 py-3 pr-11 pl-4 text-sm text-white outline-none placeholder:text-arena-400 focus:border-gold/40"
          />
          {!submitting && reveal.button}
        </div>

        {error && (
          <p
            className="text-[11px] tracking-wider text-gold"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!password || submitting}
            className={`flex-1 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
              password && !submitting
                ? 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
                : 'cursor-not-allowed bg-arena-700 text-arena-400'
            }`}
          >
            {submitting ? '…' : t('arena.join.unlock')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-white/20 px-5 py-3 text-[11px] tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
