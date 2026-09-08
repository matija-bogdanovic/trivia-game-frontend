import { redirect } from 'next/navigation';
import OAuthReturn from './oauth_return';

/**
 * The root is where the app sends you after signing in, after confirming an
 * account, and after leaving a game — six redirects across login, signup,
 * confirm and game_context all land here. The pre-reskin dashboard that used
 * to live at this path is gone, so this forwards to the arena home rather
 * than leaving those redirects on a 404.
 *
 * It is also the Cognito hosted-UI callback. That arrives as `/?code=…`, and
 * redirecting it would drop the code before Amplify could trade it for
 * tokens, which is exactly why Google sign-in never completed. So a callback
 * is handed to the client instead of being redirected away; everything else
 * still goes straight to /home.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const isCallback = 'code' in params || 'error' in params;

  if (isCallback) return <OAuthReturn failed={'error' in params} />;

  redirect('/home');
}
