'use client';

import { apiFetch } from '@/app/helpers/api';

/**
 * Turning OS notifications on and off.
 *
 * ── THE PERMISSION IS SPENT ONCE ───────────────────────────────────────────
 * A browser gives a site exactly one chance to ask. Refuse it and the prompt
 * never appears again — the user has to dig through site settings to undo it.
 * So `enablePush` is only ever called from a real click on a control that
 * says what it is about to do; nothing here runs on page load, and there is
 * deliberately no "ask on first visit".
 *
 * ── THE KEY IS PUBLIC ──────────────────────────────────────────────────────
 * applicationServerKey is the VAPID PUBLIC key and belongs in the bundle. It
 * is what lets the push service check that a message came from us; the
 * private half never leaves the Lambda's environment.
 */
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
  'BKmEfGUBfcZRZtBpPi9DTcdpr5Duc0IN2TbyN1wTuAlLKWhCoRFWXScdqpdzZL-UKNuOSCTRptbtLsY1obcIeC4';

export type PushState =
  /** no service worker or no Push API — an older browser, or iOS Safari
   *  outside an installed home-screen app, where this cannot work at all */
  | 'unsupported'
  /** refused, and the browser will not ask again */
  | 'denied'
  /** allowed and registered on this browser */
  | 'on'
  /** could be turned on: never asked, or allowed but not registered */
  | 'off';

/**
 * The Push API wants the key as bytes and gives no help converting it.
 *
 * Backed by an explicitly allocated ArrayBuffer rather than Uint8Array.from,
 * because applicationServerKey is typed as BufferSource — which excludes a
 * view that might sit on a SharedArrayBuffer, and that is what the inferred
 * type of `from` allows.
 */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** registers the worker if it is not already, and returns it */
async function worker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js');
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    return sub ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

/**
 * Ask, subscribe, and tell the server.
 *
 * `lang` rides along because a service worker cannot read localStorage, where
 * the language choice lives — so it is stored on the subscription row and sent
 * back with each push. Two letters, not a sentence: the wording still belongs
 * to the client.
 *
 * Re-subscribing is safe and is in fact how the row stays correct — the server
 * upserts on the endpoint, so this also re-points a shared browser at whoever
 * is signed in now.
 */
export async function enablePush(lang: string): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return permission === 'denied' ? 'denied' : 'off';
  }

  const reg = await worker();
  // ready, not register's promise: a worker that is registered but not yet
  // active has no usable pushManager
  await navigator.serviceWorker.ready;

  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      // required by every browser now; a push nobody sees is not allowed
      userVisibleOnly: true,
      applicationServerKey: keyBytes(VAPID_PUBLIC_KEY),
    }));

  const res = await apiFetch('/push/subscribe', {
    body: { subscription: subscription.toJSON(), lang },
  });
  if (!res.ok) {
    /*
     * The browser is now subscribed to a server that does not know it, which
     * would be a push nobody could ever send. Undo it rather than leaving
     * that: the toggle reads "off", which is the truth.
     */
    await subscription.unsubscribe().catch(() => {});
    return 'off';
  }
  return 'on';
}

/** stop this browser, both halves */
export async function disablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      // the server first: if the browser end succeeds and this fails, the row
      // survives to be pushed at forever, and only a 410 would ever clear it
      await apiFetch('/push/unsubscribe', {
        body: { endpoint: sub.endpoint },
      }).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {
    // nothing to undo
  }
  return 'off';
}
