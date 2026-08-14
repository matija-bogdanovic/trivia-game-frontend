'use client';

/**
 * Labelled text input in the arena style.
 *
 * The error is wired through aria-describedby and aria-invalid rather than
 * only coloured, so it reaches a screen reader too.
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

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-[10px] tracking-[0.2em] text-arena-300 uppercase"
      >
        {label}
      </label>
      <input
        id={fieldId}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
        className={`w-full border bg-arena-750 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-arena-400 focus:border-gold/40 disabled:opacity-50 ${
          error ? 'border-gold/60' : 'border-white/10'
        }`}
      />

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
