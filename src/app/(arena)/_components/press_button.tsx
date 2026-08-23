'use client';

import Link from 'next/link';

/**
 * A button that behaves like a physical one.
 *
 * The arena's buttons are flat rectangles that change colour on hover, which
 * is fine for "confirm" and wrong for the one control the whole home screen is
 * built around. This one sits on a solid ledge, lifts when you point at it,
 * and COMPRESSES onto the ledge when you press — the thing that makes a
 * button feel worth pressing rather than merely clickable.
 *
 * ── HOW THE LEDGE WORKS ────────────────────────────────────────────────────
 * A box-shadow with NO blur is a solid slab under the face, so `0 6px 0` is a
 * 6px lip of gold-dark. Pressing moves the face down by exactly as much as the
 * lip shrinks — translate-y 6px against a 6px smaller shadow — so the bottom
 * edge stays put and only the face travels. That is what reads as depressing a
 * key rather than the whole button sliding down the page.
 *
 * Transform and shadow are the only animated properties, both compositor-
 * friendly, so the press stays sharp on a phone. The duration is 75ms: a press
 * that takes longer than the tap feels like lag rather than feedback.
 *
 * Reduced motion is already handled globally — globals.css collapses
 * transition-duration inside .arena-root — so the button still moves to its
 * pressed position, it simply arrives instantly.
 *
 * ── VARIANTS ───────────────────────────────────────────────────────────────
 * `primary` is the gold CTA. `secondary` is the same mechanic in the arena
 * greens, for the buttons standing beside it — the press should feel like one
 * family, not like the gold one is a different kind of object.
 */

type Variant = 'primary' | 'secondary';

const FACE: Record<Variant, string> = {
  primary: 'bg-gold text-arena-950 hover:bg-gold-light',
  secondary: 'bg-arena-700 text-white hover:bg-arena-600',
};

/**
 * The ledge, its hover height, and its pressed height.
 *
 * Written as literal classes rather than composed from a variable, because
 * Tailwind only ships the utilities it can see in the source — a class built
 * at runtime is a class that is not in the stylesheet.
 */
const LEDGE: Record<Variant, string> = {
  primary:
    'shadow-[0_6px_0_0_var(--color-gold-dark)] ' +
    'hover:shadow-[0_8px_0_0_var(--color-gold-dark)] ' +
    'active:shadow-[0_0_0_0_var(--color-gold-dark)]',
  secondary:
    'shadow-[0_6px_0_0_var(--color-arena-900)] ' +
    'hover:shadow-[0_8px_0_0_var(--color-arena-900)] ' +
    'active:shadow-[0_0_0_0_var(--color-arena-900)]',
};

export default function PressButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex select-none items-center justify-center rounded-lg',
        'text-sm font-bold tracking-[0.2em] uppercase',
        'transition-[transform,box-shadow,background-color] duration-75 ease-out',
        // the face rises 2px on hover and drops 6px on press — the same 6px
        // the ledge loses, so the bottom edge never moves
        'hover:-translate-y-0.5 active:translate-y-1.5',
        'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none',
        FACE[variant],
        LEDGE[variant],
        className,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}
