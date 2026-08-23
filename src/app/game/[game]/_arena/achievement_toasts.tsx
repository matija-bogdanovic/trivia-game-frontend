'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissAchievementNotice } from '@/app/redux/slicers/game_slice';
import type { AchievementNotice } from '@/app/redux/slicers/game_slice';
import type { AppDispatch, RootState } from '@/app/redux/store';
import { useGame } from '@/app/components/hooks/game/context/game_context';
import { useT } from '@/app/lib/i18n';
import { XIcon } from '@/app/(arena)/_components/icons';
import { faceFor } from '@/app/(arena)/_lib/achievement_icons';

/**
 * Unlocked-achievement toasts, bottom-right of the game.
 *
 * ── WHEN THESE ACTUALLY APPEAR ─────────────────────────────────────────────
 * `achievements_unlocked` is a real message on the game socket, and this is
 * wired to it and nothing else — no client-side guessing at unlock conditions,
 * which would be a second, disagreeing implementation of rules the server owns.
 *
 * Two things follow from that, and both are the server's shape, not this
 * component's:
 *
 *   · It is sent AFTER a match, from the same pass that writes the wallet, so
 *     a badge lands on the game-over screen rather than mid-round. There is no
 *     mid-play unlock signal to subscribe to — nothing computes achievements
 *     while a round is running.
 *   · Only the always-on `ws` server sends it (manager.ts, persistResults).
 *     The serverless engine now behind NEXT_PUBLIC_WS_URL records no game
 *     result at all, so on that deployment this queue simply stays empty and
 *     nothing renders.
 *
 * Filtered to the signed-in player: the message is broadcast to the whole room
 * so everyone can be told in chat, but somebody else's badge is not your
 * notification.
 *
 * ── DISMISSAL ──────────────────────────────────────────────────────────────
 * Three ways out, because a toast that can only time out is a toast you have
 * to wait for: the close button, a downward swipe on touch, and the timer as
 * the fallback. The timer pauses while a finger is down, so a half-finished
 * swipe cannot have the toast vanish out from under it.
 */

/** how long a toast sits before it retires itself */
const AUTO_DISMISS_MS = 6000;
/** how long the exit runs before the toast is dropped from the queue —
 *  must stay in step with the duration-[260ms] class on the toast below */
const ANIMATION_MS = 260;
/** how many are on screen at once; the rest wait their turn behind them */
const MAX_VISIBLE = 3;
/** drag distance, in px, past which letting go dismisses rather than springs back */
const SWIPE_DISMISS_PX = 56;

/**
 * Split the server's one-string achievement into a title and its condition.
 *
 * Same em-dash rule buildAchievements() reads the catalog with — kept to the
 * one line it takes rather than pulling that helper in, because that one maps
 * a whole catalog against a set of unlocked ids and this has a single name.
 */
function splitName(raw: string): { title: string; condition: string } {
  const dash = raw.indexOf('—');
  if (dash < 0) return { title: raw.trim(), condition: '' };
  return {
    title: raw.slice(0, dash).trim(),
    condition: raw.slice(dash + 1).trim(),
  };
}

function Toast({
  notice,
  onDismiss,
}: {
  notice: AchievementNotice;
  onDismiss: () => void;
}) {
  const { t } = useT();
  const { title, condition } = splitName(notice.name);
  /*
   * The same face the grid gives this badge. A toast that announced First
   * Blood with a gold star and a tile that showed a red drop would be two
   * different badges as far as the reader is concerned.
   */
  const face = faceFor(notice.id);

  /** false for one frame so the entrance transition has somewhere to come from */
  const [shown, setShown] = useState(false);
  /** set once, on the way out — the same flag drives both exit paths */
  const [leaving, setLeaving] = useState(false);
  /** how far a finger has dragged it down, in px; null when nothing is dragging */
  const [dragY, setDragY] = useState<number | null>(null);

  const startY = useRef(0);
  const dismissed = useRef(false);

  /**
   * Play the exit, then remove. Guarded because all three routes out land
   * here and two of them can race — a timer firing as a finger lifts.
   */
  const leave = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setLeaving(true);
    setTimeout(onDismiss, ANIMATION_MS);
  }, [onDismiss]);

  useEffect(() => {
    // next frame, so the browser paints the off-screen state first
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  /*
   * The fallback timer. It is restarted whenever a drag ends, and not running
   * at all while one is in progress — reading a badge with a finger on it
   * should not be a race against the clock.
   */
  useEffect(() => {
    if (dragY !== null) return;
    const id = setTimeout(leave, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [dragY, leave]);

  /*
   * Swipe down to dismiss, touch only.
   *
   * Pointer events rather than touch events so one set of handlers covers pen
   * as well, but gated on pointerType: dragging a toast with a mouse is not a
   * gesture anyone means, and the close button is the pointer's way out. Only
   * downward travel counts — an upward drag springs back — and the capture
   * keeps the move events coming if the finger leaves the toast's box.
   */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    startY.current = e.clientY;
    setDragY(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragY === null) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  };

  const onPointerUp = () => {
    if (dragY === null) return;
    if (dragY >= SWIPE_DISMISS_PX) leave();
    else setDragY(null); // springs back, and restarts the timer
  };

  const dragging = dragY !== null && dragY > 0;
  const offset = leaving ? 0 : (dragY ?? 0);

  return (
    <div
      /*
       * pointer-events-auto re-enables this one box inside the
       * pointer-events-none column, so the toast takes the close button and
       * the swipe while everything around it stays click-through to the game.
       */
      className={`pointer-events-auto relative w-[17rem] border border-gold/30 bg-arena-800 shadow-[0_0_0_1px_rgba(0,0,0,0.4)] select-none ${
        dragging ? '' : 'transition-all duration-[260ms] ease-out'
      } ${
        shown && !leaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-4 opacity-0'
      }`}
      style={{
        transform: offset
          ? `translateY(${offset}px)`
          : undefined /* the classes own it when idle */,
        opacity: offset
          ? Math.max(0, 1 - offset / (SWIPE_DISMISS_PX * 2))
          : undefined,
        // a finger dragging this must not also scroll the page behind it
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* the gold rule that marks it as an unlock rather than a system notice */}
      <div className="h-0.5 bg-gold" aria-hidden="true" />

      <div className="flex items-start gap-3 p-3.5 pr-9">
        <face.Icon className={`h-6 w-6 shrink-0 ${face.tone}`} />
        <div className="min-w-0">
          <div className="mb-1 text-[9px] tracking-[0.25em] text-gold uppercase">
            {t('arena.ach.unlockedToast')}
          </div>
          <div className="truncate text-[12px] font-bold text-white">
            {title}
          </div>
          {condition && (
            <div className="mt-0.5 text-[10px] leading-snug text-arena-200">
              {condition}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={leave}
        aria-label={t('arena.ach.dismiss')}
        className="absolute top-2 right-2 cursor-pointer p-1 leading-none text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function AchievementToasts() {
  const dispatch = useDispatch<AppDispatch>();
  const { username } = useGame();
  const notices = useSelector((s: RootState) => s.game.achievementNotices);

  // somebody else's badge belongs in chat, which already announces it
  const mine = notices.filter((n) => n.username === username);
  const visible = mine.slice(0, MAX_VISIBLE);

  if (visible.length === 0) return null;

  return (
    /*
     * Fixed to the bottom-right and click-through: the HUD and the leave
     * button sit under this column, and a badge must never be why a tap on
     * them did nothing. Each toast turns pointer events back on for itself.
     *
     * Newest at the bottom, nearest the corner, so an arriving toast pushes
     * the older ones up rather than displacing the one being read.
     */
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6"
      role="status"
      aria-live="polite"
    >
      {visible.map((notice) => (
        <Toast
          key={notice.key}
          notice={notice}
          onDismiss={() => dispatch(dismissAchievementNotice(notice.key))}
        />
      ))}
    </div>
  );
}
