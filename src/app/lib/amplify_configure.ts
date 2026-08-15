import { Amplify } from 'aws-amplify';
import { amplifyResourceConfig } from './amplify_config';

/** set NEXT_PUBLIC_GOOGLE_AUTH=1 once the Google identity provider is
 *  configured in the Cognito user pool to show the Google button */
export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH === '1';

/**
 * Configure Amplify in the browser.
 *
 * ssr: true is what puts the tokens in cookies rather than localStorage, which
 * is what lets middleware read the session server-side. Changing it would
 * silently disable the auth gate.
 */
export const amplifyConfigure = () => {
  Amplify.configure(amplifyResourceConfig, { ssr: true });
};
