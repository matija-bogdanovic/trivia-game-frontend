import { redirect } from 'next/navigation';

/**
 * /achievements is /profile now.
 *
 * The gallery this route used to render showed the same catalog, from the same
 * wallet, through the same AchievementGrid as the strip on /profile — one
 * screen with a heading and a percentage, and one without. Two routes for one
 * list is two places to keep in step, and they had already drifted once.
 *
 * A REDIRECT rather than a deletion, because the route existed and was linked:
 * a bookmark, a sidebar somebody has open in another tab, or a link in a chat
 * would all 404. Redirecting costs one file and makes every old path land
 * somewhere that still answers the question it was asking.
 *
 * Server-side, so it never renders — the reader goes straight to /profile
 * without a frame of empty gallery in between.
 */
export default function AchievementsPage() {
  redirect('/profile');
}
