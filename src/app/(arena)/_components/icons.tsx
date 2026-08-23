/**
 * Inline SVG icons.
 *
 * The sidebar's other icons are typed characters — '★', '◆', '⚙' — which is
 * cheap and has carried the nav so far, but a glyph is whatever the user's
 * font decides it is: it changes shape between platforms, and there is no
 * character for most things worth drawing. Real icons go here instead.
 *
 * ── THE RULES EVERY ICON IN THIS FILE FOLLOWS ──────────────────────────────
 * · `fill="currentColor"`, never a literal. The sidebar colours its icon slot
 *   gold when the item is active and arena-300 when it is not; an icon with a
 *   baked-in hex would sit at one colour through both states and stand out as
 *   the one thing on the rail that does not respond.
 * · No width/height attributes — the size comes from `className`, so one glyph
 *   can serve a 16px nav slot and a larger surface without a second copy.
 * · `aria-hidden` and `focusable="false"`. These sit beside a text label that
 *   already says what the link is; announcing the icon as well would read the
 *   destination twice, and IE-era SVGs are focusable by default.
 */

interface IconProps {
  /** sized by the caller — the sidebar uses h-4 w-4 */
  className?: string;
}

/**
 * A circle with a plus inside — joining something that already exists.
 *
 * Paired with the "+" glyph on Create a room deliberately: create is a bare
 * plus, join is a plus INSIDE something, which is the distinction the two
 * actions actually have.
 */
export function PlusCircleIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 3C13.4288 3 10.9154 3.76244 8.77759 5.1909C6.63975 6.61935 4.97351 8.64968 3.98957 11.0251C3.00563 13.4006 2.74819 16.0144 3.2498 18.5362C3.75141 21.0579 4.98953 23.3743 6.80762 25.1924C8.6257 27.0105 10.9421 28.2486 13.4638 28.7502C15.9856 29.2518 18.5995 28.9944 20.9749 28.0104C23.3503 27.0265 25.3807 25.3603 26.8091 23.2224C28.2376 21.0846 29 18.5712 29 16C28.9964 12.5533 27.6256 9.24882 25.1884 6.81163C22.7512 4.37445 19.4467 3.00364 16 3ZM16 27C13.8244 27 11.6977 26.3549 9.88873 25.1462C8.07979 23.9375 6.66989 22.2195 5.83733 20.2095C5.00477 18.1995 4.78693 15.9878 5.21137 13.854C5.63581 11.7202 6.68345 9.7602 8.22183 8.22183C9.76021 6.68345 11.7202 5.6358 13.854 5.21136C15.9878 4.78692 18.1995 5.00476 20.2095 5.83733C22.2195 6.66989 23.9375 8.07979 25.1462 9.88873C26.3549 11.6977 27 13.8244 27 16C26.9967 18.9164 25.8367 21.7123 23.7745 23.7745C21.7123 25.8367 18.9164 26.9967 16 27ZM22 16C22 16.2652 21.8946 16.5196 21.7071 16.7071C21.5196 16.8946 21.2652 17 21 17H17V21C17 21.2652 16.8946 21.5196 16.7071 21.7071C16.5196 21.8946 16.2652 22 16 22C15.7348 22 15.4804 21.8946 15.2929 21.7071C15.1054 21.5196 15 21.2652 15 21V17H11C10.7348 17 10.4804 16.8946 10.2929 16.7071C10.1054 16.5196 10 16.2652 10 16C10 15.7348 10.1054 15.4804 10.2929 15.2929C10.4804 15.1054 10.7348 15 11 15H15V11C15 10.7348 15.1054 10.4804 15.2929 10.2929C15.4804 10.1054 15.7348 10 16 10C16.2652 10 16.5196 10.1054 16.7071 10.2929C16.8946 10.4804 17 10.7348 17 11V15H21C21.2652 15 21.5196 15.1054 21.7071 15.2929C21.8946 15.4804 22 15.7348 22 16Z" />
    </svg>
  );
}
