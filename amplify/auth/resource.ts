import { referenceAuth } from '@aws-amplify/backend';

/**
 * ===========================================================================
 * auth — POINTS AT THE POOL THAT ALREADY EXISTS
 * ===========================================================================
 *
 * `referenceAuth`, NOT `defineAuth`. This is the most important line in the
 * Amplify setup and the easiest one to get wrong, because every tutorial uses
 * defineAuth.
 *
 * defineAuth CREATES a user pool. This project already has one —
 * eu-west-3_Uylh5ZFUK — holding live accounts, a configured Google identity
 * provider, and a callback list that has already caused one outage by being
 * wrong. Running defineAuth would stand a SECOND pool up beside it and point
 * the app at the new one: everybody signed out, Google sign-in broken, and
 * the real accounts sitting in a pool nothing references any more.
 *
 * referenceAuth adopts the existing pool, so anything Amplify adds authorizes
 * against the identities the app already has.
 *
 * ── THESE IDS ARE NOT SECRETS ──────────────────────────────────────────────
 * A user pool id and a client id are public by construction and ship in the
 * browser bundle already — src/app/lib/amplify_configure.ts is still what
 * actually configures the client, and this does not replace it.
 */
export const auth = referenceAuth({
  userPoolId: 'eu-west-3_Uylh5ZFUK',
  userPoolClientId: '3j69q67dfk60kl92gukqhdlr91',
  identityPoolId: 'eu-west-3:ee26e62a-ab48-4755-b656-462f3cca5ece',
  // the identity pool's own roles — how a signed-in browser gets temporary
  // credentials for anything Amplify adds
  authRoleArn: 'arn:aws:iam::637423486388:role/service-role/AuthRole',
  unauthRoleArn: 'arn:aws:iam::637423486388:role/service-role/AuthGuestRole',
});
