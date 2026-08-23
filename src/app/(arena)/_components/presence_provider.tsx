'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useWebSocket from 'react-use-websocket';
import { getAccessToken } from '@/app/helpers/api';
import { getSocketUrl } from '@/app/helpers/port';
import { inviteReceived } from '@/app/redux/slicers/invite_slice';
import { notificationArrived } from '@/app/redux/slicers/notification_slice';
import type { AppDispatch } from '@/app/redux/store';

/**
 * A socket for everywhere that is not a game.
 *
 * ── THE HOLE THIS FILLS ────────────────────────────────────────────────────
 * GameProvider is mounted only by src/app/game/layout.tsx, so on /home,
 * /friends, /rooms and everything else a signed-in player held NO connection.
 * Two things follow from that, and both were broken:
 *
 *   · Nothing could be pushed to them. An invite could only have reached
 *     friends already sitting in some OTHER room — close to nobody.
 *   · "Online" was almost never true. friendsList derives presence from a
 *     Connections row, and outside a game there was no row to find, so a
 *     friend reading the leaderboard showed as offline.
 *
 * This opens the same socket the game uses and sends `hello`, which is `join`
 * without a lobby: it writes the username onto the connection and nothing
 * else. That is the exact shape friendsList already reads as "online".
 *
 * ── WHY NOT JUST HOIST GameProvider ────────────────────────────────────────
 * Because it does far more than hold a socket — it owns the join handshake,
 * the password retry, the phase reducer, the reconnect re-join and the
 * navigation on room_closed. Running all of that on the settings screen to get
 * one message delivered is a large blast radius for a small need. This is the
 * socket and nothing else.
 *
 * The two never overlap: /game is its own route group with its own layout, so
 * a player is under exactly one of the two providers and holds one socket.
 */
export default function PresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    getSocketUrl(),
    { shouldReconnect: () => true }
  );

  /*
   * Announce on every open, reconnects included. The token is fetched fresh
   * rather than captured: Amplify refreshes behind getAccessToken(), and a
   * socket that reconnects an hour later would otherwise present a dead one.
   *
   * A signed-out visitor simply has no token, sends nothing, and keeps an
   * anonymous socket — harmless, and it costs one Connections row with a 2h
   * TTL.
   */
  useEffect(() => {
    if (readyState !== 1) return;
    let live = true;
    getAccessToken().then((token) => {
      if (live && token) sendJsonMessage({ type: 'hello', token });
    });
    return () => {
      live = false;
    };
  }, [readyState, sendJsonMessage]);

  useEffect(() => {
    const msg = lastJsonMessage as { type?: string } | null;
    /*
     * A bell row and a banner are two different messages for one event, and
     * both arrive here: `notification` is the durable row echoed live, and
     * `room_invite` is the prompt that wants an answer now.
     */
    if (msg?.type === 'notification') {
      const n = msg as unknown as {
        id: string;
        kind: string;
        at: number;
        data: Record<string, unknown>;
      };
      dispatch(
        notificationArrived({
          id: String(n.id),
          kind: String(n.kind),
          at: Number(n.at ?? Date.now()),
          read: false,
          data: n.data ?? {},
        })
      );
      return;
    }
    if (msg?.type !== 'room_invite') return;
    const m = msg as unknown as {
      lobbyId: string;
      code: number | null;
      roomName: string;
      isPrivate: boolean;
      from: string;
      fromName: string;
      at: number;
    };
    dispatch(
      inviteReceived({
        lobbyId: String(m.lobbyId),
        code: m.code ?? null,
        roomName: m.roomName ?? '',
        isPrivate: Boolean(m.isPrivate),
        from: String(m.from),
        fromName: m.fromName || String(m.from),
        at: m.at ?? Date.now(),
      })
    );
  }, [lastJsonMessage, dispatch]);

  return <>{children}</>;
}
