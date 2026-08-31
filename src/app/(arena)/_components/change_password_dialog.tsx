'use client';

import { useEffect, useState } from 'react';
import { updatePassword } from 'aws-amplify/auth';
import Modal from './modal';
import { usePasswordReveal } from './password_reveal';
import { authErrorKey } from '@/app/helpers/auth_errors';
import { useT } from '@/app/lib/i18n';

/**
 * Change your password, against Cognito, from the client.
 *
 * ── WHY NO BACKEND ENDPOINT ────────────────────────────────────────────────
 * Amplify's `updatePassword({ oldPassword, newPassword })` IS Cognito's
 * ChangePassword API: it sends both passwords with the signed-in user's access
 * token, and Cognito verifies the old one itself. The app already holds that
 * token — every apiFetch and the whole auth flow run on it — so a Lambda in
 * the middle would add a hop, a second place for the password to exist, and
 * nothing else. There is no /change-password route in the backend and none is
 * needed.
 *
 * It also means the CURRENT password never reaches this app's own servers.
 * Cognito is the only thing that sees it.
 *
 * ── VALIDATION IS THE SIGNUP RULE, NOT A NEW ONE ───────────────────────────
 * The same regex signup uses, which mirrors the Cognito password policy. It is
 * checked here so a weak password is refused instantly with the hint beside
 * the field, rather than after a round trip that returns
 * InvalidPasswordException — but Cognito is still the authority, and its
 * refusal is surfaced if the policy and this regex ever disagree.
 *
 * ── WHY THE ERRORS ARE MAPPED HERE AND NOT BY authErrorKey ─────────────────
 * authErrorKey folds NotAuthorizedException into "incorrect username or
 * password", which is right on a login screen and wrong here: you are signed
 * in, there is no username in question, and the only thing that can be wrong
 * is the current password. Two codes get a message of their own for that
 * reason; everything else falls through to the shared mapper.
 */

// the same policy signup enforces: 8+, upper, lower, digit, symbol
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function changeErrorKey(err: unknown): string {
  const name = (err as { name?: string })?.name ?? '';
  switch (name) {
    // signed in already, so this can only be the old password
    case 'NotAuthorizedException':
      return 'arena.pw.wrongCurrent';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'arena.pw.tooMany';
    // the access token went stale between opening the form and submitting it
    case 'UserUnAuthenticatedException':
    case 'NotSignedIn':
      return 'arena.pw.expired';
    default:
      return authErrorKey(err);
  }
}

export default function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const currentReveal = usePasswordReveal('pw-current');
  const nextReveal = usePasswordReveal('pw-new');
  const repeatReveal = usePasswordReveal('pw-repeat');

  // a reopened dialog is a fresh one — never a filled-in form from last time
  useEffect(() => {
    if (!open) return;
    setCurrent('');
    setNext('');
    setRepeat('');
    setError('');
    setDone(false);
    setBusy(false);
  }, [open]);

  /*
   * The three refusals worth making before asking Cognito. Each is checked in
   * the order a reader fills the form in, so the message names the field they
   * are most likely still looking at.
   */
  function localError(): string | null {
    if (!PASSWORD_RE.test(next)) return 'authError.passwordWeak';
    if (next !== repeat) return 'authError.passwordMismatch';
    if (next === current) return 'arena.pw.sameAsOld';
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !current) return;

    const local = localError();
    if (local) {
      setError(t(local));
      return;
    }

    setBusy(true);
    setError('');
    try {
      await updatePassword({ oldPassword: current, newPassword: next });
      setDone(true);
      /*
       * The fields are cleared on success and NOT left filled behind the
       * confirmation. The dialog stays open long enough to be read, and what
       * it says is the whole outcome — there is nothing left to correct.
       */
      setCurrent('');
      setNext('');
      setRepeat('');
    } catch (err) {
      setError(t(changeErrorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  const field =
    'w-full border border-white/10 bg-arena-750 py-3 pr-11 pl-4 text-sm text-white outline-none placeholder:text-arena-400 focus:border-gold/40 disabled:opacity-50';

  return (
    <Modal
      open={open}
      closeButton
      title={t('arena.pw.title')}
      onClose={onClose}
    >
      {done ? (
        <>
          <p className="text-sm text-arena-100" role="status">
            {t('arena.pw.done')}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer bg-gold py-3 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.common.close')}
          </button>
        </>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div>
            <label
              htmlFor="pw-current"
              className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
            >
              {t('arena.pw.current')}
            </label>
            <div className="relative">
              <input
                id="pw-current"
                type={currentReveal.type}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
                className={field}
              />
              {!busy && currentReveal.button}
            </div>
          </div>

          <div>
            <label
              htmlFor="pw-new"
              className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
            >
              {t('arena.pw.new')}
            </label>
            <div className="relative">
              <input
                id="pw-new"
                type={nextReveal.type}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                disabled={busy}
                aria-describedby="pw-new-hint"
                className={field}
              />
              {!busy && nextReveal.button}
            </div>
            <p id="pw-new-hint" className="mt-1.5 text-[11px] text-arena-300">
              {t('auth.passwordHint')}
            </p>
          </div>

          <div>
            <label
              htmlFor="pw-repeat"
              className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
            >
              {t('arena.pw.repeat')}
            </label>
            <div className="relative">
              <input
                id="pw-repeat"
                type={repeatReveal.type}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                autoComplete="new-password"
                disabled={busy}
                className={field}
              />
              {!busy && repeatReveal.button}
            </div>
          </div>

          {error && (
            <p
              className="text-[11px] leading-relaxed tracking-wider text-gold"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || !current || !next || !repeat}
              className={`flex-1 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                busy || !current || !next || !repeat
                  ? 'cursor-not-allowed bg-arena-700 text-arena-400'
                  : 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
              }`}
            >
              {busy ? t('arena.pw.saving') : t('arena.pw.submit')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-sm border border-white/20 px-5 py-3 text-[11px] tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.common.cancel')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
