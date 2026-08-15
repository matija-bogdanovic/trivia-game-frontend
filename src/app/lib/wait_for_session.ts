/**
 * Wait for an auth session to exist, or conclude that it never will.
 *
 * This is the whole decision behind the OAuth return screen, kept out of the
 * component so it can be tested without a browser or a Cognito round trip.
 *
 * It polls rather than listening for an event on purpose. Amplify registers
 * its OAuth completion side effect inside Amplify.configure(), which this app
 * runs at module scope in Providers — so the code exchange begins before React
 * has rendered anything, and the Hub event announcing its success can fire
 * before any component is mounted to hear it. Hub does not replay, so a
 * listener attached in an effect can miss the event permanently. Asking "is
 * there a session yet?" has no such window: whenever the exchange lands, the
 * next poll sees it.
 *
 * The deadline is generous because the cost of waiting is a spinner and the
 * cost of giving up early is telling someone their sign-in failed when it did
 * not.
 */
export interface WaitForSessionOptions {
  /** true once tokens exist; may throw or hang — neither ends the wait early */
  hasSession: () => Promise<boolean>;
  /** give up after this long */
  deadlineMs?: number;
  /** gap between checks */
  pollMs?: number;
  /** set cancelled to stop early — the caller's unmount flag */
  control?: { cancelled: boolean };
  /** injectable clock and timer, for tests */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function waitForSession({
  hasSession,
  deadlineMs = 20000,
  pollMs = 200,
  control,
  now = () => Date.now(),
  sleep = defaultSleep,
}: WaitForSessionOptions): Promise<boolean> {
  const started = now();

  const poll = async (): Promise<boolean> => {
    for (;;) {
      if (control?.cancelled) return false;

      // a throw means "could not tell", not "no session" — the deadline
      // decides, so a transient failure mid-exchange cannot end the wait
      let present = false;
      try {
        present = await hasSession();
      } catch {
        present = false;
      }
      if (present) return true;

      if (control?.cancelled) return false;
      if (now() - started >= deadlineMs) return false;

      await sleep(pollMs);
    }
  };

  /*
   * The deadline has to hold even if hasSession() never settles, so it runs on
   * a real timer beside the loop rather than as a check between polls.
   *
   * That is not hypothetical. Amplify's fetchAuthSession() awaits the in-flight
   * OAuth promise, and a `?code=` it cannot exchange — a code already spent, or
   * one that arrives with no matching PKCE verifier in storage after a refresh
   * — can leave that promise pending. Checking the clock only between polls
   * meant the loop never got to look at it: verified against a live build,
   * where a stale code left the screen saying "signing you in" indefinitely.
   */
  let expire: ReturnType<typeof setTimeout> | undefined;
  const guard = new Promise<boolean>((resolve) => {
    expire = setTimeout(() => resolve(false), deadlineMs);
  });

  try {
    return await Promise.race([poll(), guard]);
  } finally {
    clearTimeout(expire);
  }
}
