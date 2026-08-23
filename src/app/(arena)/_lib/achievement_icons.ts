import { DropIcon, FlameIcon, StarIcon } from '@/app/(arena)/_components/icons';

/**
 * The face each achievement wears.
 *
 * ── WHY THIS LIVES IN THE FRONTEND ─────────────────────────────────────────
 * The server's catalog is eight strings of the form "First Blood — win your
 * first game" and nothing else: no icon, no colour, no category. So a themed
 * badge cannot be read from the data, only mapped onto it — and the map has to
 * be keyed by the one stable thing the server does send, the `id`.
 *
 * Keyed by id and NOT by title, because the title is display text that a
 * translation or a reword would change; `first_win` will still be `first_win`.
 *
 * ── UNMAPPED IS A STAR, NOT A GUESS ────────────────────────────────────────
 * Anything absent here falls back to the star it has always worn. An id that
 * appears in a future catalog therefore renders correctly the day it ships
 * rather than crashing or rendering nothing, and the ones still waiting for a
 * decision stay visibly undecided instead of being quietly assigned something
 * plausible.
 *
 * ── THE TONE IS FOR THE UNLOCKED STATE ONLY ────────────────────────────────
 * A locked badge stays muted whatever it is mapped to. A red drop glowing
 * beside "LOCKED" would be the tile announcing an achievement the player has
 * not earned.
 */
export interface AchievementFace {
  Icon: (props: { className?: string }) => React.ReactElement;
  /** text colour once the badge is earned */
  tone: string;
}

export const ACHIEVEMENT_FACES: Record<string, AchievementFace> = {
  // "First Blood — win your first game"
  first_win: { Icon: DropIcon, tone: 'text-blood' },
  // "On Fire — win 10 games in a row"; the name is the icon
  streak_10: { Icon: FlameIcon, tone: 'text-flame' },
};

export const DEFAULT_FACE: AchievementFace = {
  Icon: StarIcon,
  tone: 'text-gold',
};

export const faceFor = (id: string): AchievementFace =>
  ACHIEVEMENT_FACES[id] ?? DEFAULT_FACE;
