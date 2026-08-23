/**
 * The question bank's categories.
 *
 * These 24 strings are not a vocabulary this app invented — they are the exact
 * category names stored on every row of the `Questions` table, which came from
 * the Open Trivia Database import. The host's selection is matched against
 * them BY STRING in the game engine, so a value that differs by so much as a
 * colon selects nothing and silently falls back to every category.
 *
 * That is why they live here as one exported list rather than being typed into
 * a picker: there is exactly one correct spelling of each, and it is the
 * server's.
 *
 * ── WHY THE LABEL IS SEPARATE FROM THE VALUE ───────────────────────────────
 * The `id` is sent to the server and must never be translated. The label is
 * what a player reads and must be. Keeping them in one object stops a
 * translated string ever being mistaken for a selectable value — the bug that
 * would produce a room whose categories match nothing.
 *
 * The old list this replaces (`_mock/rooms.ts`) offered six invented names —
 * 'Science', 'History', 'Mixed' — none of which matched a real category, so a
 * room created with them filtered to nothing at all.
 */

export interface QuestionCategory {
  /** the exact string stored on the question row; sent to the server as-is */
  id: string;
  /** i18n key for what the player sees */
  labelKey: string;
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  { id: 'General Knowledge', labelKey: 'arena.cat.general' },
  { id: 'Entertainment: Books', labelKey: 'arena.cat.books' },
  { id: 'Entertainment: Film', labelKey: 'arena.cat.film' },
  { id: 'Entertainment: Music', labelKey: 'arena.cat.music' },
  { id: 'Entertainment: Musicals & Theatres', labelKey: 'arena.cat.musicals' },
  { id: 'Entertainment: Television', labelKey: 'arena.cat.tv' },
  { id: 'Entertainment: Video Games', labelKey: 'arena.cat.videoGames' },
  { id: 'Entertainment: Board Games', labelKey: 'arena.cat.boardGames' },
  { id: 'Science & Nature', labelKey: 'arena.cat.scienceNature' },
  { id: 'Science: Computers', labelKey: 'arena.cat.computers' },
  { id: 'Science: Mathematics', labelKey: 'arena.cat.mathematics' },
  { id: 'Mythology', labelKey: 'arena.cat.mythology' },
  { id: 'Sports', labelKey: 'arena.cat.sports' },
  { id: 'Geography', labelKey: 'arena.cat.geography' },
  { id: 'History', labelKey: 'arena.cat.history' },
  { id: 'Politics', labelKey: 'arena.cat.politics' },
  { id: 'Art', labelKey: 'arena.cat.art' },
  { id: 'Celebrities', labelKey: 'arena.cat.celebrities' },
  { id: 'Animals', labelKey: 'arena.cat.animals' },
  { id: 'Vehicles', labelKey: 'arena.cat.vehicles' },
  { id: 'Entertainment: Comics', labelKey: 'arena.cat.comics' },
  { id: 'Science: Gadgets', labelKey: 'arena.cat.gadgets' },
  { id: 'Entertainment: Japanese Anime & Manga', labelKey: 'arena.cat.anime' },
  { id: 'Entertainment: Cartoon & Animations', labelKey: 'arena.cat.cartoons' },
];

/**
 * An EMPTY selection means every category, and is what the server defaults to.
 *
 * So "all selected" and "none selected" are the same room, and the picker
 * sends [] for both rather than listing all 24 — fewer strings to get wrong,
 * and a room that keeps working if the bank ever gains a category.
 */
export function categoriesToSend(selected: string[]): string[] {
  return selected.length === QUESTION_CATEGORIES.length ? [] : selected;
}
