import { Amplify } from 'aws-amplify';

export const amplifyConfigure = () => {
  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId:
            process.env.NEXT_PUBLIC_USER_POOL_ID || 'eu-west-3_Uylh5ZFUK',
          userPoolClientId:
            process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ||
            '1lcoq8c9r7lvhi3l4klhb4idth',
          identityPoolId:
            process.env.NEXT_PUBLIC_IDENTITY_POOL_ID ||
            'eu-west-3:ee26e62a-ab48-4755-b656-462f3cca5ece',
          loginWith: {
            email: true,
          },
          signUpVerificationMethod: 'code',
          userAttributes: {
            email: {
              required: true,
            },
            name: {
              required: false, // The display name from your signup
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
