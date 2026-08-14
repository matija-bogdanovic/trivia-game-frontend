'use client';

import { authErrorKey } from '@/app/helpers/auth_errors';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';
import { autoSignIn, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

amplifyConfigure();

function Page() {
  const { t } = useT();
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const inputRefs = useMemo(
    () => Array.from({ length: 6 }, () => React.createRef<HTMLInputElement>()),
    []
  );

  // set by the signup page; the ?u= param covers landing here in a fresh tab,
  // and we only ask for it by hand when neither is available
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('u');
    setUsername(fromQuery ?? sessionStorage.getItem('signupUsername') ?? '');
  }, []);

  const codeValue = code.join('');
  const isComplete = codeValue.length === 6 && code.every((c) => c !== '');

  const handleVerify = useCallback(async () => {
    if (!username.trim()) {
      setError(t('confirm.usernamePrompt'));
      return;
    }
    setError('');
    setBusy(true);
    try {
      await confirmSignUp({
        username: username.trim(),
        confirmationCode: codeValue,
      });
      // signup requested autoSignIn — try it, fall back to the login page
      try {
        await autoSignIn();
        router.push('/');
      } catch {
        router.push('/login');
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setError(t(authErrorKey(err)));
      setBusy(false);
    }
  }, [codeValue, router, t, username]);

  const focusInput = useCallback(
    (idx: number) => {
      if (idx < 0 || idx > 5) return;
      const ref = inputRefs[idx];
      if (ref && ref.current) {
        ref.current.focus();
        ref.current.select();
      }
    },
    [inputRefs]
  );

  useEffect(() => {
    focusInput(0);
  }, [focusInput]);

  const setDigit = (idx: number, value: string) => {
    const sanitized = value.replace(/\D/g, '');
    if (sanitized === '') {
      const next = [...code];
      next[idx] = '';
      setCode(next);
      return false;
    }
    const digit = sanitized.charAt(0);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    return true;
  };

  const handleChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '');
      if (selectAllMode) {
        const next = ['', '', '', '', '', ''] as string[];
        if (value) {
          next[0] = value.charAt(0);
        }
        setCode(next);
        setSelectAllMode(false);
        if (value) {
          focusInput(1);
        } else {
          focusInput(0);
        }
        return;
      }
      const filled = setDigit(idx, value);
      if (filled) {
        focusInput(idx + 1);
      }
    };

  const handleKeyDown =
    (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      if ((e.metaKey || e.ctrlKey) && (key === 'a' || key === 'A')) {
        e.preventDefault();
        setSelectAllMode(true);
        focusInput(0);
        return;
      }
      if (key === 'Backspace') {
        if (code[idx] === '') {
          focusInput(idx - 1);
        } else {
          const next = [...code];
          next[idx] = '';
          setCode(next);
        }
        return;
      }
      if (key === 'ArrowLeft') {
        e.preventDefault();
        focusInput(idx - 1);
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        focusInput(idx + 1);
        return;
      }
      if (key.length === 1 && /[^\d]/.test(key)) {
        e.preventDefault();
      }
    };

  const handlePaste =
    (idx: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
      if (!pasted) return;
      const next = [...code];
      let writeIndex = selectAllMode ? 0 : idx;
      for (let i = 0; i < pasted.length && writeIndex < 6; i++) {
        next[writeIndex] = pasted.charAt(i);
        writeIndex++;
      }
      setCode(next);
      setSelectAllMode(false);
      focusInput(Math.min(writeIndex, 5));
    };

  // six digits in — verify without making them reach for the button. The ref
  // keeps a rejected code from resubmitting itself on every render.
  const submittedRef = useRef('');
  useEffect(() => {
    if (!isComplete || busy || !username.trim()) return;
    if (submittedRef.current === codeValue) return;
    submittedRef.current = codeValue;
    handleVerify();
  }, [isComplete, busy, username, codeValue, handleVerify]);

  // resend cooldown: 30s, 60s, then doubling, capped at 120 min
  const [resendCount, setResendCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const computeCooldown = (count: number) => {
    if (count === 0) return 30;
    if (count === 1) return 60;
    const seconds = 60 * Math.pow(2, count - 1);
    const maxSeconds = 120 * 60;
    return Math.min(seconds, maxSeconds);
  };

  const startCooldown = (count: number) => {
    const seconds = computeCooldown(count);
    setCooldownSeconds(seconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!username.trim()) {
      setError(t('confirm.usernamePrompt'));
      return;
    }
    setError('');
    setNotice('');
    try {
      await resendSignUpCode({ username: username.trim() });
      setNotice(t('confirm.resent'));
      setResendCount((c) => c + 1);
      startCooldown(resendCount);
    } catch (err) {
      console.error('Resend failed:', err);
      setError(t(authErrorKey(err)));
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-wide">
        {t('confirm.title')}
      </h1>
      <p className="mb-6 text-[11px] tracking-wider text-arena-200">
        {t('confirm.sub')}
      </p>

      {error && (
        <p
          className="mb-5 border border-gold/30 bg-gold/10 px-4 py-3 text-[12px] leading-relaxed text-gold"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          className="mb-5 border border-arena-400 bg-arena-750 px-4 py-3 text-[12px] leading-relaxed text-arena-100"
          role="status"
        >
          {notice}
        </p>
      )}

      {username === '' && (
        <div className="mb-5">
          <label
            htmlFor="confirm-username"
            className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
          >
            {t('auth.username')}
          </label>
          <input
            id="confirm-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full border border-white/10 bg-arena-750 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-arena-400 focus:border-gold/40"
          />
        </div>
      )}

      <div
        className="mb-6 flex justify-center gap-2 sm:gap-3"
        role="group"
        aria-label={t('confirm.title')}
      >
        {code.map((value, index) => (
          <input
            key={index}
            ref={inputRefs[index]}
            type="text"
            value={value}
            maxLength={1}
            inputMode="numeric"
            pattern="[0-9]*"
            // lets the browser offer the emailed code straight from the inbox
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            onChange={handleChange(index)}
            onKeyDown={handleKeyDown(index)}
            onPaste={handlePaste(index)}
            aria-label={`Digit ${index + 1} of 6`}
            className={`h-12 w-10 border bg-arena-750 text-center text-2xl font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold sm:h-14 sm:w-12 ${
              value
                ? 'border-gold/50 text-gold'
                : 'border-white/10 text-white focus:border-gold/40'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        disabled={!isComplete || busy}
        onClick={handleVerify}
        className={`w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none ${
          !isComplete || busy
            ? 'cursor-not-allowed bg-arena-700 text-arena-400'
            : 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
        }`}
      >
        {busy ? '…' : t('confirm.verify')}
      </button>

      <div className="mt-6 border-t border-white/[0.07] pt-6 text-center">
        <button
          type="button"
          disabled={cooldownSeconds > 0}
          onClick={handleResend}
          className="cursor-pointer text-[11px] tracking-wider text-gold uppercase transition-colors hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:text-arena-400"
        >
          {t('confirm.resend')}
        </button>
        {cooldownSeconds > 0 && (
          <p className="mt-2 text-[11px] text-arena-300" aria-live="polite">
            {t('confirm.retryIn', {
              time: `${Math.floor(cooldownSeconds / 60)}:${`${cooldownSeconds % 60}`.padStart(2, '0')}`,
            })}
          </p>
        )}
      </div>
    </>
  );
}

export default Page;
