'use client';

import { useEffect, useId, useRef } from 'react';
import { XIcon } from './icons';
import { useT } from '@/app/lib/i18n';

/**
 * The arena modal.
 *
 * The app had this shape three times over — the lobby's leave and kick
 * confirms, the game screen's password form — each hand-rolled, so nothing
 * guaranteed they stayed alike. This is that same shape, once: dark overlay,
 * gold-edged card, an eyebrow title, and whatever the caller puts inside.
 *
 * It brings the parts the copies kept omitting: Escape closes it, focus moves
 * into the dialog on open and returns to whatever opened it on close, and a
 * click on the backdrop dismisses. A password prompt that traps you because
 * Escape does nothing is worse than the inline field it replaced.
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
  /** false for a prompt that must be answered by its own buttons */
  dismissible = true,
  closeButton = false,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
  /**
   * Show a close button in the corner.
   *
   * Escape and the backdrop already dismiss, but neither is visible. A dialog
   * opened to LOOK at something needs a way out that can be seen; a confirm
   * dialog does not, because its buttons are the way out and an X beside them
   * is a third answer nobody asked for.
   */
  closeButton?: boolean;
  /** widen the card past the confirm-dialog default */
  wide?: boolean;
}) {
  const { t } = useT();
  const titleId = useId();
  const card = useRef<HTMLDivElement>(null);
  const returnTo = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    returnTo.current = document.activeElement;
    // the first thing a keyboard user should land on is inside the dialog
    const focusable = card.current?.querySelector<HTMLElement>(
      'input, button, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      (returnTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(0,0,0,0.75)] p-4"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // the card is not the backdrop; clicking inside it must not dismiss
        onClick={(e) => e.stopPropagation()}
        className={`relative flex w-full flex-col gap-4 rounded-lg border border-gold/30 bg-arena-800 p-8 ${
          wide ? 'max-w-md' : 'max-w-sm'
        }`}
      >
        {closeButton && dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('arena.common.close')}
            className="absolute top-3 right-3 cursor-pointer p-1 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
        <div
          id={titleId}
          className="text-[11px] tracking-[0.3em] text-gold uppercase"
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}
