'use client';

/**
 * "Continue with Google", in the arena palette.
 *
 * Google's brand guidelines ask for their mark on the button, so the G keeps
 * its four colours against a neutral tile while the surrounding chrome stays
 * on the dark green / gold scheme. The divider above it is part of the
 * component so login and signup cannot drift apart.
 */
export default function GoogleButton({
  label = 'Continue with Google',
  disabled = false,
  onPress,
}: {
  label?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <div className="block">
      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] tracking-[0.25em] text-arena-300 uppercase">
          ili
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={onPress}
        disabled={disabled}
        className={`flex w-full items-center justify-center gap-3 border py-3.5 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none ${
          disabled
            ? 'cursor-not-allowed border-arena-600 text-arena-500'
            : 'cursor-pointer border-white/20 text-white hover:border-white/40 hover:bg-arena-700'
        }`}
      >
        <svg
          className="h-4 w-4 shrink-0"
          viewBox="0 0 18 18"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.33z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.17 6.66 3.58 9 3.58z"
          />
        </svg>
        <span>{label}</span>
      </button>
    </div>
  );
}
