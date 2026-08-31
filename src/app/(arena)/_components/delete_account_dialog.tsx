'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import Modal from './modal';
import { deleteAccount } from '@/app/helpers/account';
import { useT } from '@/app/lib/i18n';

/** what has to be typed to arm the button — matches the Serbian label */
const CONFIRM_WORD = 'OBRIŠI';

/**
 * Deleting an account, behind a deliberate confirmation.
 *
 * This is the one irreversible action in the app: it takes the Cognito user,
 * the player record and the friendships with it, and no amount of clicking
 * afterwards brings any of them back. A yes/no prompt is not enough of a
 * speed bump for that, so the button stays dead until the word is typed. It
 * is not security — nothing here is a check the server relies on — it is the
 * difference between a slip and a decision.
 *
 * On success the session goes before the redirect. Leaving a signed-in
 * session pointing at a user that no longer exists would send the player to a
 * home screen whose every request 401s, which reads as a broken app rather
 * than as a completed deletion.
 */
export default function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // a reopened dialog starts disarmed
  useEffect(() => {
    if (open) {
      setTyped('');
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const armed = typed.trim().toUpperCase() === CONFIRM_WORD;

  const run = async () => {
    if (!armed || busy) return;
    setBusy(true);
    setError(null);

    const result = await deleteAccount();

    if (result.outcome !== 'deleted') {
      /*
       * Stay open either way, but for different reasons. `failed` means
       * nothing was deleted. `partial` means the data went and the Cognito
       * login did not — signing them out there would claim a deletion that
       * did not finish, and they would still be able to log back in. The
       * server explains it better than a generic line, so its message wins.
       */
      setError(
        result.message ??
          t(
            result.outcome === 'partial'
              ? 'arena.settings.deletePartial'
              : 'arena.settings.deleteFailed'
          )
      );
      setBusy(false);
      return;
    }

    try {
      await signOut();
    } catch {
      // the account is already gone; a failed sign-out must not strand them
    }
    router.replace('/login');
  };

  return (
    <Modal
      open={open}
      title={t('arena.settings.deleteTitle')}
      onClose={busy ? () => {} : onClose}
      dismissible={!busy}
    >
      <p className="text-sm text-arena-100">{t('arena.settings.deleteBody')}</p>
      <ul className="list-disc space-y-1 pl-5 text-[11px] text-arena-300">
        <li>{t('arena.settings.deleteLoses1')}</li>
        <li>{t('arena.settings.deleteLoses2')}</li>
        <li>{t('arena.settings.deleteLoses3')}</li>
      </ul>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <label
          className="text-[11px] tracking-wider text-arena-200"
          htmlFor="delete-confirm"
        >
          {t('arena.settings.deleteType', { word: CONFIRM_WORD })}
        </label>
        <input
          id="delete-confirm"
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          disabled={busy}
          aria-invalid={Boolean(error)}
          className="w-full rounded-lg border border-red-500/40 bg-arena-750 px-4 py-3 text-sm tracking-widest text-white uppercase outline-none focus:border-red-400"
        />

        {error && (
          <p
            className="text-[11px] tracking-wider text-red-400"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!armed || busy}
            className={`flex-1 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none ${
              armed && !busy
                ? 'cursor-pointer rounded-lg border border-red-500/60 bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'cursor-not-allowed border border-arena-600 bg-arena-700 text-arena-400'
            }`}
          >
            {busy ? '…' : t('arena.settings.deleteConfirm')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-white/20 px-5 py-3 text-[11px] tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('arena.common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
