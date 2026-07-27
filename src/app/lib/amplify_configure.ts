import { Amplify } from 'aws-amplify';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/';

/** set NEXT_PUBLIC_GOOGLE_AUTH=1 once the Google identity provider is
 *  configured in the Cognito user pool to show the Google button */
export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH === '1';

export const amplifyConfigure = () => {
  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId:
            process.env.NEXT_PUBLIC_USER_POOL_ID || 'eu-west-3_Uylh5ZFUK',
          userPoolClientId:
            process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ||
            '3j69q67dfk60kl92gukqhdlr91',
          identityPoolId:
            process.env.NEXT_PUBLIC_IDENTITY_POOL_ID ||
            'eu-west-3:ee26e62a-ab48-4755-b656-462f3cca5ece',
          loginWith: {
            email: true,
            oauth: {
              domain:
                process.env.NEXT_PUBLIC_COGNITO_DOMAIN ||
                'eu-west-3uylh5zfuk.auth.eu-west-3.amazoncognito.com',
              scopes: [
                'openid',
                'email',
                'profile',
                // required so federated (Google) users can update their
                // own attributes, e.g. saving a profile picture
                'aws.cognito.signin.user.admin',
              ],
              redirectSignIn: [APP_URL],
              redirectSignOut: [APP_URL],
              responseType: 'code',
            },
          },
          signUpVerificationMethod: 'code',
          userAttributes: {
            email: {
              required: true,
            },
            name: {
              required: false,
            },
          },
          allowGuestAccess: true,
          passwordFormat: {
            minLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialCharacters: true,
          },
        },
      },
    },
    { ssr: true }
  );
};
