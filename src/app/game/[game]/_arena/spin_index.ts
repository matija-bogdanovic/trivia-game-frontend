/**
 * Where the highlight sits, at a given moment in a spin.
 *
 * The whole animation is this one pure function of time. Nothing is stored,
 * nothing accumulates, and no interval drives the position — the index is
 * derived from the clock every render. That is what makes a reload land in
 * step: a client that joins halfway through computes the same index for the
 * same instant as one that watched from the start, because both are answering
 * the same question about the same three server-supplied numbers.
 *
 * It also means the landing is not a separate case that has to be kept in
 * agreement with the animation. At the end of the ramp the arithmetic can only
 * produce the target — see the note on `steps`.
 */

/** how many complete passes around the grid before settling */
const CYCLES = 4;

/** always starts from the first tile, so every client draws the same spin */
const START_INDEX = 0;

/**
 * Cubic ease-out: quick away, long slow settle. The shape matters more than
 * the exact curve — the last second should read as "which of these two?".
 */
function ease(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export function spinIndexAt({
  now,
  startedAt,
  endsAt,
  targetIndex,
  playerCount,
}: {
  /** all three on the SAME clock — convert server times first */
  now: number;
  startedAt: number;
  endsAt: number;
  targetIndex: number;
  playerCount: number;
}): number {
  if (playerCount <= 0) return 0;
  if (targetIndex < 0) return 0;

  // a zero or inverted window has no animation to draw, only an answer
  if (!(endsAt > startedAt)) return targetIndex % playerCount;
  if (now >= endsAt) return targetIndex % playerCount;
  if (now <= startedAt) return START_INDEX;

  const progress = (now - startedAt) / (endsAt - startedAt);

  /*
   * Whole tiles travelled: four full passes plus the offset to the target. The
   * total is therefore congruent to targetIndex modulo playerCount, so when
   * eased progress reaches 1 the expression lands exactly on the target
   * without a special case — and cannot land anywhere else.
   */
  const offset = (targetIndex - START_INDEX + playerCount) % playerCount;
  const steps = CYCLES * playerCount + offset;

  return (START_INDEX + Math.floor(ease(progress) * steps)) % playerCount;
}
