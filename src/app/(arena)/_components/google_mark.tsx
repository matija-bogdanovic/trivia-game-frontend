/**
 * Google's G, in its four brand colours.
 *
 * It lives in its own file because two unrelated places need it: the
 * "Continue with Google" button on login/signup, and the badge that marks a
 * federated account once someone is signed in. Google's brand guidelines
 * require the mark keep its own colours, so it is deliberately the one thing
 * in the app that ignores the arena palette.
 */
export function GoogleMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 ${className}`}
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
  );
}

/**
 * Shown next to the name of a player whose account is federated Google.
 *
 * Email/password accounts render nothing at all — the badge is there to
 * explain why Settings cannot change your password, not to label everyone.
 * The mark is decorative, so the meaning is carried by the accessible label
 * rather than by the colours.
 */
export default function GoogleBadge({
  label,
  size = 'md',
}: {
  label: string;
  /** sm rides alongside the name in the sidebar strip; md sits in a heading */
  size?: 'sm' | 'md';
}) {
  // sized by a prop rather than a className override: two competing h-*
  // utilities resolve by stylesheet order, not by which one the caller passed
  const frame = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const mark = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white/90 ${frame}`}
    >
      <GoogleMark className={mark} />
    </span>
  );
}
