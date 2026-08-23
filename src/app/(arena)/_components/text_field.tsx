'use client';

import { usePasswordReveal } from './password_reveal';

/**
 * Labelled text input in the arena style.
 *
 * The error is wired through aria-describedby and aria-invalid rather than
 * only coloured, so it reaches a screen reader too.
 *
 * A field declared type="password" grows a show/hide eye. The reveal hook is
 * called unconditionally — hooks cannot be conditional — and its button is
 * simply not rendered for the other types, which is also why the input reads
 * its type from the hook only when masking was asked for. Padding is widened
 * on the right for those fields alone, so a plain text field is not left with
 * a gap where no button sits.
 */
export default function TextField({
  fieldId,
  label,
  type = 'text',
  value,
  placeholder = '',
  autoComplete,
  hint,
  error = null,
  disabled = false,
  onValueChange,
}: {
  fieldId: string;
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) {
  const describedBy = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  const masked = type === 'password';
  const reveal = usePasswordReveal(fieldId);

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={masked ? reveal.type : type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          className={`w-full border bg-arena-750 py-3 pl-4 text-sm text-white outline-none transition-colors placeholder:text-arena-400 focus:border-gold/40 disabled:opacity-50 ${
            masked ? 'pr-11' : 'pr-4'
          } ${error ? 'border-gold/60' : 'border-white/10'}`}
        />
        {masked && !disabled && reveal.button}
      </div>

      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-[11px] text-gold">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-[11px] text-arena-300">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
