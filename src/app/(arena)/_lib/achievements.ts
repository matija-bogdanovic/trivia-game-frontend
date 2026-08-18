export interface AchievementView {
  id: string;
  title: string;
  /** how it is earned, as the server words it */
  condition: string;
  unlocked: boolean;
}

/**
 * Turn the wallet's catalog into something renderable.
 *
 * The server sends each entry as one string — "First Blood — win your first
 * game" — with the title and the condition joined by an em dash. Splitting on
 * that is reading the data, not inventing it; everything shown comes from the
 * server, and an entry without the dash keeps its whole text as the title
 * rather than being mangled to fit.
 *
 * NOT AVAILABLE from the backend: an icon, a structured description, and any
 * notion of progress. An achievement is unlocked or it is not — there is no
 * "7 of 10 wins" anywhere to read — so nothing here pretends to show progress.
 */
export function buildAchievements(
  catalog: { id: string; name: string }[] | undefined | null,
  unlocked: string[] | undefined | null
): AchievementView[] {
  const won = new Set(unlocked ?? []);
  return (catalog ?? []).map((entry) => {
    const raw = String(entry?.name ?? '');
    const dash = raw.indexOf('—');
    return {
      id: String(entry?.id ?? ''),
      title:
        (dash >= 0 ? raw.slice(0, dash) : raw).trim() ||
        String(entry?.id ?? ''),
      condition: dash >= 0 ? raw.slice(dash + 1).trim() : '',
      unlocked: won.has(String(entry?.id ?? '')),
    };
  });
}
