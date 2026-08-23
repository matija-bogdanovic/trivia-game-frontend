'use client';

import { useId, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from './icons';
import { useT } from '@/app/lib/i18n';

/**
 * The show/hide eye that sits inside a password field.
 *
 * ── ONE IMPLEMENTATION, THREE CALLERS ──────────────────────────────────────
 * The app masks passwords in two different shapes: the shared TextField the
 * auth pages use, and two bare <input type="password"> elements (the room
 * password on create, and the prompt a locked room raises). Writing the eye
 * three times would have produced three eyes that drifted, so the toggle lives
 * here and the callers borrow it.
 *
 * `usePasswordReveal()` returns the input `type` and the button to render
 * beside it. The caller owns the wrapper and the padding, because only the
 * caller knows how wide its field is.
 *
 * ── WHY THE ICON IS THE STATE, NOT THE ACTION ──────────────────────────────
 * Shown: a struck-through eye, "Hide password". Hidden: a plain eye, "Show
 * password". The icon says what the button will DO, which is the convention
 * every password field on the web follows — an eye you press to see.
 *
 * ── ACCESSIBILITY ──────────────────────────────────────────────────────────
 * A real <button type="button"> — type matters, because these fields sit in
 * forms and a bare <button> submits them. aria-pressed carries the toggle
 * state, aria-label carries the meaning (the icons are aria-hidden), and
 * aria-controls points at the input so the relationship is not merely visual.
 *
 * tabIndex is deliberately NOT -1. A sighted keyboard user has as much reason
 * to reveal what they typed as a mouse user, and hiding the control from Tab
 * to "keep the form fast" takes that away.
 */
export function usePasswordReveal(inputId?: string) {
  const { t } = useT();
  const [shown, setShown] = useState(false);
  const fallbackId = useId();
  const controls = inputId ?? fallbackId;

  const Icon = shown ? EyeSlashIcon : EyeIcon;
  const label = shown
    ? t('arena.common.hidePassword')
    : t('arena.common.showPassword');

  const button = (
    <button
      type="button"
      onClick={() => setShown((v) => !v)}
      aria-pressed={shown}
      aria-label={label}
      aria-controls={controls}
      title={label}
      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-arena-300 transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return { shown, type: shown ? 'text' : 'password', button, controls };
}
