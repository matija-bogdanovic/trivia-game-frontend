/**
 * When a match was played, written the way the reader's language writes it.
 *
 * Shared by /history and /profile so one match never reads as two different
 * moments depending on which screen you are looking at. The wallet stores
 * `playedAt` as epoch ms; everything else here is presentation.
 */

/** `15. avg 2026 · 14:32` in Serbian, `Aug 15, 2026 · 14:32` in English. */
export function playedAtLabel(playedAt: number, lang: string): string {
  const locale = lang === 'sr' ? 'sr-Latn-RS' : 'en-US';
  const d = new Date(playedAt);
  const date = d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}
