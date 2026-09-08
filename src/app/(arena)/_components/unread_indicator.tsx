'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';

/**
 * The unread count, on the browser tab.
 *
 * Two indicators, one number — the same derived count the bell shows, so they
 * cannot disagree. Renders nothing; it exists for its effects.
 *
 * ── WHY BOTH ───────────────────────────────────────────────────────────────
 * The title works everywhere and is readable when the tab is wide. The favicon
 * is what survives a pinned or crowded tab strip, where the title is three
 * letters and an ellipsis. Neither covers the other's case.
 *
 * ── THE FAVICON IS DRAWN, NOT SWAPPED ──────────────────────────────────────
 * There is one icon in this app (src/app/favicon.ico, served at /favicon.ico)
 * and no badged variants of it, so the badge is composited at runtime: load
 * the icon into an Image, paint it on a 64px canvas, put a gold disc in the
 * corner, and point <link rel="icon"> at the result.
 *
 * Gold rather than red, because red in this app means nothing at all — the
 * palette deliberately has no error colour, and a red dot would be the only
 * one in the product. Gold is what "this matters" already looks like here.
 *
 * The count is drawn INSIDE the disc when it fits in one digit and becomes a
 * bare disc past nine: two digits at 64px, scaled down to the 16px a tab
 * actually renders, is a smudge. A smudge that says "something" is worth more
 * than a number that says nothing legibly.
 *
 * ── FAILURE IS SILENT AND TOTAL ────────────────────────────────────────────
 * A canvas can be unavailable, the icon can fail to load, and a browser can
 * ignore a dynamic icon entirely. Every one of those leaves the ORIGINAL
 * favicon in place rather than a broken one, and the title indicator carries
 * on regardless — they are independent on purpose.
 */

const BASE_ICON = '/favicon.ico';

/** the tag we own; created once, and never touching any other icon link */
function badgeLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[data-unread-badge]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.setAttribute('data-unread-badge', '');
    document.head.appendChild(link);
  }
  return link;
}

function drawBadge(unread: number) {
  const image = new Image();
  image.onload = () => {
    try {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(image, 0, 0, size, size);

      const r = size * 0.3;
      const cx = size - r - 2;
      const cy = r + 2;

      // a ring in the page colour, so the disc reads as ON the icon rather
      // than as part of whatever art happens to be under it
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = '#091508';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a227';
      ctx.fill();

      if (unread < 10) {
        ctx.fillStyle = '#060f07';
        ctx.font = `bold ${Math.round(r * 1.5)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(unread), cx, cy + 1);
      }

      badgeLink().href = canvas.toDataURL('image/png');
    } catch {
      // a tainted canvas or a missing 2d context: leave the icon alone
    }
  };
  // no onerror handler needed beyond ignoring it — the plain icon stays
  image.src = BASE_ICON;
}

export default function UnreadIndicator() {
  const items = useSelector((s: RootState) => s.notifications.items);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    /*
     * The plain title is read from the document rather than hard-coded, so it
     * follows whatever the route set — and the prefix is stripped before
     * reading, or a second update would produce "(2) (1) Ipak se okreće".
     */
    const plain = document.title.replace(/^\(\d+\+?\)\s*/, '');
    document.title =
      unread > 0 ? `(${unread > 9 ? '9+' : unread}) ${plain}` : plain;

    if (unread > 0) {
      drawBadge(unread);
    } else {
      const link = document.querySelector<HTMLLinkElement>(
        'link[data-unread-badge]'
      );
      // removed rather than pointed back at the plain icon: with our tag gone
      // the browser falls back to the real one, and there is no second icon
      // link left claiming to be authoritative
      link?.remove();
    }
  }, [unread]);

  return null;
}
