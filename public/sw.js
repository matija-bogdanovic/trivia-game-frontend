/*
 * ===========================================================================
 * sw.js — the service worker, which exists only to receive push
 * ===========================================================================
 *
 * It deliberately does NOT cache anything. A service worker that also serves
 * the app is a second, stale copy of it, and the one thing worse than no
 * offline support is offline support that shows yesterday's build. This one
 * has two jobs: draw the banner, and take the click somewhere useful.
 *
 * ── WHY THE WORDING LIVES HERE ─────────────────────────────────────────────
 * The server stores no display sentence for a notification — a translated
 * string written into DynamoDB is frozen in whichever language the SENDER
 * happened to be reading. So the wording is the client's, and this file is
 * the client when the app is closed.
 *
 * The LANGUAGE, though, has to travel: a worker cannot read localStorage,
 * where the app keeps the choice. So it is stored on the push subscription
 * row at subscribe time and echoed back in the payload. Two letters, not a
 * sentence — the principle holds.
 */

const STRINGS = {
  sr: {
    room_invite: {
      title: 'Poziv u sobu',
      body: (d) =>
        d.roomName
          ? `${d.fromName || d.from} te zove u „${d.roomName}"`
          : `${d.fromName || d.from} te zove u sobu`,
    },
    fallback: { title: 'Ipak se okreće', body: () => 'Imaš novo obaveštenje' },
    open: 'Otvori',
  },
  en: {
    room_invite: {
      title: 'Room invite',
      body: (d) =>
        d.roomName
          ? `${d.fromName || d.from} is asking you into "${d.roomName}"`
          : `${d.fromName || d.from} is asking you into a room`,
    },
    fallback: { title: 'Ipak se okreće', body: () => 'You have a new notification' },
    open: 'Open',
  },
};

/** where a click on this kind of notification should land */
function urlFor(kind, data) {
  if (kind === 'room_invite' && data.lobbyId) return `/game/${data.lobbyId}`;
  return '/home';
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim())
);

self.addEventListener('push', (event) => {
  /*
   * A push with no readable payload still deserves a banner. Chrome sends a
   * bodyless push to verify a subscription, and some services do on their own
   * schedule; showing nothing would be indistinguishable from being broken,
   * and on several browsers a push event that draws no notification costs the
   * site its permission.
   */
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const lang = STRINGS[payload.lang] ? payload.lang : 'sr';
  const strings = STRINGS[lang];
  const kind = payload.kind;
  const data = payload.data || {};
  const shape = strings[kind] || strings.fallback;

  event.waitUntil(
    self.registration.showNotification(shape.title, {
      body: shape.body(data),
      icon: '/pfp.svg',
      badge: '/pfp.svg',
      /*
       * One banner per notification id, so a re-delivered push replaces its
       * own earlier copy instead of stacking a second identical row. Falls
       * back to the kind, which at least collapses a run of the same thing.
       */
      tag: payload.id || kind || 'arena',
      renotify: true,
      data: { url: urlFor(kind, data), ...data },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/home';

  /*
   * Focus a tab that is already open before opening another. Someone with the
   * app open in a background tab wants that tab, not a second one — and
   * navigating it is what makes the invite actually take them to the room
   * rather than to whatever they were last looking at.
   */
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            if ('navigate' in client) client.navigate(target).catch(() => {});
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      })
  );
});
