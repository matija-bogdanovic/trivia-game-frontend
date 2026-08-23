import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Room invites, held outside the game slice on purpose.
 *
 * An invite arrives while you are anywhere — browsing rooms, reading the
 * leaderboard, sitting in a different lobby — so it cannot live in the state
 * that `resetGame()` wipes on every leave, and it has to survive the two
 * places a socket is opened (the arena shell and the game route) rather than
 * belonging to either.
 *
 * ── ONE AT A TIME ──────────────────────────────────────────────────────────
 * A newer invite REPLACES the one on screen rather than queueing behind it.
 * Two banners stacked over the page is two decisions demanded at once, and the
 * older one is the less interesting of the two by definition — the room may
 * even have filled since. Whoever asked last is who you answer.
 */
export interface RoomInvite {
  lobbyId: string;
  code: number | null;
  roomName: string;
  isPrivate: boolean;
  /** the inviter's username — stable, used for keys */
  from: string;
  /** what the banner shows */
  fromName: string;
  at: number;
}

/** the server's answer to an invite this player sent */
export interface InviteResult {
  /** the refusal code, or null when it went */
  reason: string | null;
  target: string;
}

interface InviteState {
  /** the invite awaiting an answer, or null */
  pending: RoomInvite | null;
  /**
   * Rooms the reader has already said no to.
   *
   * Declining has to STICK: without this, a host who clicks invite twice —
   * or any reconnect that replays — puts the banner straight back up, and a
   * dismissal that does not dismiss is worse than no dismiss button.
   */
  declined: string[];
  /**
   * Targets the SERVER has confirmed, not ones this client asked about.
   *
   * The tick beside a friend's name means "the invite reached them", which
   * only invite_sent can establish — marking it optimistically on click would
   * put a tick next to someone who turned out to be offline.
   */
  sent: string[];
  /** the last refusal, for the sender's own eyes */
  result: InviteResult | null;
}

const initialState: InviteState = {
  pending: null,
  declined: [],
  sent: [],
  result: null,
};

const inviteSlice = createSlice({
  name: 'invite',
  initialState,
  reducers: {
    inviteReceived: (state, action: PayloadAction<RoomInvite>) => {
      if (state.declined.includes(action.payload.lobbyId)) return;
      state.pending = action.payload;
    },
    inviteDeclined: (state) => {
      if (state.pending) state.declined.push(state.pending.lobbyId);
      state.pending = null;
    },
    /** accepted, or no longer relevant — cleared without remembering it */
    inviteCleared: (state) => {
      state.pending = null;
    },
    inviteSent: (state, action: PayloadAction<string>) => {
      if (!state.sent.includes(action.payload)) state.sent.push(action.payload);
      state.result = { reason: null, target: action.payload };
    },
    inviteRefused: (state, action: PayloadAction<InviteResult>) => {
      state.result = action.payload;
    },
    /*
     * Leaving a room forgets who was invited INTO it. The ticks belong to that
     * lobby, and carrying them into the next one would show a friend as
     * already invited to a room nobody has asked them about.
     */
    inviteSessionReset: (state) => {
      state.sent = [];
      state.result = null;
    },
  },
});

export const {
  inviteReceived,
  inviteDeclined,
  inviteCleared,
  inviteSent,
  inviteRefused,
  inviteSessionReset,
} = inviteSlice.actions;
export default inviteSlice.reducer;
