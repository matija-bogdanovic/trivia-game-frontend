'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { BellIcon, CheckIcon, UserPlusIcon } from './icons';
import {
  allNotificationsRead,
  notificationRead,
  notificationsLoaded,
} from '@/app/redux/slicers/notification_slice';
import { inviteCleared } from '@/app/redux/slicers/invite_slice';
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from '@/app/helpers/notifications';
import type { AppDispatch, RootState } from '@/app/redux/store';
import { useT } from '@/app/lib/i18n';

/**
 * The bell.
 *
 * ── TWO SOURCES, ONE LIST ──────────────────────────────────────────────────
 * It loads the durable feed once on mount and receives live ones over the
 * socket PresenceProvider holds. Both go into the same slice in the same
 * shape, so this component never asks which way something arrived.
 *
 * ── UNREAD IS COUNTED HERE ─────────────────────────────────────────────────
 * From the list, every render, rather than read from a stored number. A count
 * that is maintained can drift; a count that is derived cannot. This is the
 * one number in the app that has to be believed — a badge showing 3 over an
 * empty panel teaches people to ignore the badge.
 *
 * ── READING IS OPTIMISTIC ──────────────────────────────────────────────────
 * The reducer marks it read immediately and the request follows. Waiting for a
 * round trip before the badge dims feels broken on a slow connection, and the
 * cost of a lost write is that one row is unread again next load — a failure
 * everybody already understands.
 */

/** "pre 5 min" — relative, because "at 14:32" needs today's date to mean anything */
function ago(
  at: number,
  t: (k: string, v?: Record<string, string | number>) => string
) {
  const secs = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (secs < 60) return t('arena.notif.justNow');
  const mins = Math.floor(secs / 60);
  if (mins < 60) return t('arena.notif.minutes', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('arena.notif.hours', { n: hours });
  return t('arena.notif.days', { n: Math.floor(hours / 24) });
}

export default function NotificationBell() {
  const { t } = useT();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((s: RootState) => s.notifications.items);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    let live = true;
    fetchNotifications().then((feed) => {
      if (live && feed) dispatch(notificationsLoaded(feed.notifications));
    });
    return () => {
      live = false;
    };
  }, [dispatch]);

  /*
   * A panel that covers the page must close on Escape and on a click outside
   * it. Neither is optional — this one opens from a corner and can sit over
   * whatever the reader was doing.
   */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const openOne = (n: AppNotification) => {
    if (!n.read) {
      dispatch(notificationRead(n.id));
      markNotificationRead({ id: n.id });
    }
    setOpen(false);
    if (n.kind === 'room_invite' && typeof n.data.lobbyId === 'string') {
      /*
       * Acting on the bell row answers the banner too — they are the same
       * invite, and leaving the banner up after the reader has walked into the
       * room would ask a question they have already answered.
       */
      dispatch(inviteCleared());
      router.push(`/game/${n.data.lobbyId}`);
    }
  };

  const label = unread
    ? t('arena.notif.open', { n: unread })
    : t('arena.notif.openNone');

  return (
    <div className="relative" ref={panel}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        className="relative cursor-pointer px-2 py-2 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        <BellIcon className="h-4 w-4" />
        {unread > 0 && (
          <span
            className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-arena-950 tabular-nums"
            aria-hidden="true"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('arena.notif.title')}
          className="absolute right-0 bottom-full z-50 mb-2 w-72 rounded-lg border border-white/[0.07] bg-arena-800 shadow-lg lg:bottom-auto lg:top-full lg:mt-2 lg:mb-0"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2">
            <span className="text-[10px] tracking-[0.2em] text-arena-300 uppercase">
              {t('arena.notif.title')}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => {
                  dispatch(allNotificationsRead());
                  markNotificationRead({ all: true });
                }}
                className="inline-flex cursor-pointer items-center gap-1 text-[10px] tracking-wider text-gold uppercase transition-colors hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                <CheckIcon className="h-3 w-3 shrink-0" />
                {t('arena.notif.markAll')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-3 py-8 text-center text-[11px] text-arena-300">
                {t('arena.notif.empty')}
              </p>
            )}
            {items.map((n) => {
              const from = String(n.data.fromName ?? n.data.from ?? '');
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openOne(n)}
                  className={`flex w-full cursor-pointer items-start gap-2.5 border-b border-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-arena-750 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                    n.read ? 'opacity-60' : ''
                  }`}
                >
                  {/* unread carries a gold dot; read carries the space where it was */}
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-gold'}`}
                    aria-hidden="true"
                  />
                  <UserPlusIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-arena-300" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] leading-snug text-arena-100">
                      {n.kind === 'room_invite'
                        ? t('arena.notif.invite', { name: from })
                        : t('arena.notif.unknown')}
                    </span>
                    <span className="mt-0.5 block text-[9px] tracking-wider text-arena-400 uppercase">
                      {ago(n.at, t)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
