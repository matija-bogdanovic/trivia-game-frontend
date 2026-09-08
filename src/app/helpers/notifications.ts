import { apiFetch } from '@/app/helpers/api';

/**
 * The notification feed, as the client sees it.
 *
 * One shape for both deliveries: the object the socket pushes and the object
 * POST /notifications returns are identical, because the server builds them
 * from the same value. Nothing here has to know which way a notification
 * arrived.
 *
 * `data` is untyped per kind on purpose. The server stores no display string —
 * a translated sentence written into the table would be frozen in whichever
 * language the sender was reading — so the client owns the wording, and each
 * kind reads the fields it needs out of this bag.
 */
export interface AppNotification {
  id: string;
  kind: string;
  at: number;
  read: boolean;
  data: Record<string, unknown>;
}

export interface NotificationFeed {
  notifications: AppNotification[];
  unread: number;
}

/** the newest window, newest first, or null when the request failed */
export async function fetchNotifications(): Promise<NotificationFeed | null> {
  try {
    const res = await apiFetch('/notifications', { body: {} });
    if (!res.ok) return null;
    const data = await res.json();
    const notifications: AppNotification[] = Array.isArray(data?.notifications)
      ? data.notifications.map((n: AppNotification) => ({
          id: String(n?.id ?? ''),
          kind: String(n?.kind ?? ''),
          at: Number(n?.at ?? 0),
          read: Boolean(n?.read),
          data: (n?.data ?? {}) as Record<string, unknown>,
        }))
      : [];
    return {
      notifications,
      unread:
        typeof data?.unread === 'number'
          ? data.unread
          : notifications.filter((n) => !n.read).length,
    };
  } catch {
    return null;
  }
}

/**
 * Mark one, or every unread one.
 *
 * Deliberately fire-and-forget at the call site: the reducer marks it read
 * immediately and this catches up. A bell that waited for a round trip before
 * dimming would feel broken on a slow connection, and the cost of losing the
 * write is that one row is unread again on the next load — which is the
 * failure everybody already understands.
 */
export async function markNotificationRead(
  target: { id: string } | { all: true }
): Promise<boolean> {
  try {
    const res = await apiFetch('/notifications/read', { body: target });
    return res.ok;
  } catch {
    return false;
  }
}
