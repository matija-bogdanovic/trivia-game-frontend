'use client';

import Input from '@/app/components/general/input';
import { confirmSignUp } from 'aws-amplify/auth';
import { useRouter } from 'next/router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();
function Page() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const router = useRouter();
  const [selectAllMode, setSelectAllMode] = useState(false);
  const inputRefs = useMemo(
    () => Array.from({ length: 6 }, () => React.createRef<HTMLInputElement>()),
    []
  );
  const handleVerify = async () => {
    try {
      await confirmSignUp({
        username: sessionStorage.getItem('signupUsername') as string,
        confirmationCode: codeValue,
      });
      router.push('/login');
    } catch (error) {
      console.error('Verification failed:', error);
      // Show error message
    }
  };

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
      if (key.length === 1 && /\d/.test(key)) {
        // allow, will be handled by onInput/onChange
        return;
      }
      // Block non-digit characters
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

  const codeValue = code.join('');
  const isComplete = codeValue.length === 6 && code.every((c) => c !== '');

  // Resend cooldown state
  const [resendCount, setResendCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const computeCooldown = (count: number) => {
    // 0 -> 30s, 1 -> 60s, then doubling capped at 120 mins
    if (count === 0) return 30;
    if (count === 1) return 60;
    const seconds = 60 * Math.pow(2, count - 1);
    const maxSeconds = 120 * 60; // 120 minutes
    return Math.min(seconds, maxSeconds);
  };

  const startCooldown = (count: number) => {
    const seconds = computeCooldown(count);
    setCooldownSeconds(seconds);
    if (intervalRef.current)
      clearInterval(intervalRef.current as unknown as number);
    intervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current)
            clearInterval(intervalRef.current as unknown as number);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current)
        clearInterval(intervalRef.current as unknown as number);
    };
  }, []);

  return (
    <div className="min-h-[60vh] container w-full flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Enter verification code</h1>
        <p className="text-gray-500 mt-1">
          We sent a 6-digit code to your email
        </p>
      </div>
      <div className="flex items-center gap-3">
        {code.map((value, index) => (
          <Input
            key={index}
            type="text"
            value={value}
            maxLength={1}
            maxLengthAllowed={false}
            className="w-12 h-14 text-center text-xl rounded-md border border-gray-300 focus:outline-none"
            inputMode="numeric"
            pattern="[0-9]*"
            inputRef={inputRefs[index]}
            onChange={handleChange(index)}
            onKeyDown={handleKeyDown(index)}
            onPaste={handlePaste(index)}
            placeholder="-"
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button
          className="px-4 py-2 rounded-md border border-gray-300 disabled:opacity-40"
          disabled={cooldownSeconds > 0}
          onClick={() => {
            const nextCount = resendCount + 1;
            setResendCount(nextCount);
            startCooldown(resendCount);
          }}
        >
          Resend code
        </button>
        {cooldownSeconds > 0 && (
          <span className="text-gray-500">
            Retry in {Math.floor(cooldownSeconds / 60)}:
            {`${cooldownSeconds % 60}`.padStart(2, '0')}
          </span>
        )}
      </div>
      <button
        className={`px-5 py-2 rounded-md bg-black text-white disabled:opacity-40`}
        disabled={!isComplete}
        onClick={handleVerify}
      >
        Verify
      </button>
    </div>
  );
}

export default Page;
