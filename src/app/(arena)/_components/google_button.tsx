'use client';

import { GoogleMark } from './google_mark';

/**
 * "Continue with Google", in the arena palette.
 *
 * Google's brand guidelines ask for their mark on the button, so the G keeps
 * its four colours (see GoogleMark, shared with the federated-account badge)
 * while the surrounding chrome stays on the dark green / gold scheme. The
 * divider above it is part of the component so login and signup cannot drift
 * apart.
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
        className={`flex w-full items-center justify-center gap-3 rounded-lg border py-3.5 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none ${
          disabled
            ? 'cursor-not-allowed border-arena-600 text-arena-500'
            : 'cursor-pointer border-white/20 text-white hover:border-white/40 hover:bg-arena-700'
        }`}
      >
        <GoogleMark />
        <span>{label}</span>
      </button>
    </div>
  );
}
