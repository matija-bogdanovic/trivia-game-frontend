import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification } from '@/app/helpers/notifications';

/**
 * The bell's contents.
 *
 * Fed from two directions that must agree: POST /notifications on load, and
 * live `notification` messages over the socket. The server sends the same
 * shape both ways, so this never has to reconcile two formats — only two
 * arrival times.
 *
 * ── UNREAD IS COUNTED, NEVER TRACKED ───────────────────────────────────────
 * There is no `unread` field here. It is derived wherever it is needed, from
 * the list itself. A stored count has to be incremented on receive and
 * decremented on read, and the first path that forgets leaves a badge that is
 * permanently wrong — the one bug a notification badge cannot afford, because
 * the whole point of it is to be believed.
 */
interface NotificationState {
  items: AppNotification[];
  /** false until the first successful load, so the bell can hold its badge */
  loaded: boolean;
}

const initialState: NotificationState = { items: [], loaded: false };

/** newest first, and never the same id twice */
function merge(items: AppNotification[], incoming: AppNotification[]) {
  const byId = new Map(items.map((n) => [n.id, n]));
  for (const n of incoming) byId.set(n.id, n);
  return [...byId.values()].sort((a, b) => b.at - a.at);
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationsLoaded: (state, action: PayloadAction<AppNotification[]>) => {
      /*
       * Merged rather than replaced. A live message can land between the
       * request going out and the response coming back, and replacing would
       * drop it — the newest notification of all, and the one most likely to
       * matter.
       */
      state.items = merge(state.items, action.payload);
      state.loaded = true;
    },
    notificationArrived: (state, action: PayloadAction<AppNotification>) => {
      state.items = merge(state.items, [action.payload]);
    },
    notificationRead: (state, action: PayloadAction<string>) => {
      const found = state.items.find((n) => n.id === action.payload);
      if (found) found.read = true;
    },
    allNotificationsRead: (state) => {
      for (const n of state.items) n.read = true;
    },
    /** signing out must not leave one person's bell showing another's */
    notificationsCleared: () => initialState,
  },
});

export const {
  notificationsLoaded,
  notificationArrived,
  notificationRead,
  allNotificationsRead,
  notificationsCleared,
} = notificationSlice.actions;
export default notificationSlice.reducer;
