// app/providers.tsx
'use client';

import { Provider } from 'react-redux';
import { amplifyConfigure } from '../lib/amplify_configure';
import { store } from './store';

/**
 * Configure Amplify once, for the whole app, before anything renders.
 *
 * It used to be called at the module scope of individual pages, which meant a
 * screen that did not call it had no configured Amplify at all on a direct
 * load or a refresh. fetchAuthSession then threw, getIdentity swallowed the
 * error and returned null, and a signed-in user was shown as signed out — the
 * sidebar said "not signed in", the wallet was never fetched and Settings came
 * up blank. It only appeared to work if you happened to land first on a page
 * that did configure it and then navigated client-side, because the config is
 * a module singleton that survives in-app navigation.
 *
 * This provider wraps every route in the root layout and is a client
 * component, so putting it here means every screen has it. Configure is
 * idempotent, so the remaining per-page calls are harmless.
 */
amplifyConfigure();

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
