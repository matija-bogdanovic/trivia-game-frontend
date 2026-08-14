import { redirect } from 'next/navigation';

/**
 * The root is where the app sends you after signing in, after confirming an
 * account, and after leaving a game — six redirects across login, signup,
 * confirm and game_context all land here. The pre-reskin dashboard that used
 * to live at this path is gone, so this forwards to the arena home rather
 * than leaving those redirects on a 404.
 */
export default function Page() {
  redirect('/home');
}
