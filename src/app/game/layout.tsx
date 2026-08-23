import GameProvider from '../components/hooks/game/context/game_context';
import InviteBanner from '../(arena)/_components/invite_banner';
import UnreadIndicator from '../(arena)/_components/unread_indicator';

/**
 * The in-room experience: one socket, one route, phase-switched inside.
 * .arena-root puts it on the arena palette (see globals.css); the sidebar
 * shell is deliberately absent — a game takes the whole viewport.
 */
export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GameProvider>
      <div className="arena-root h-screen overflow-hidden">
        {children}
        {/*
          An invite can land while you are already in a lobby — a second friend
          asking you somewhere else — and the answer is the same one the shell
          offers. No PresenceProvider here: GameProvider already holds the
          socket, and it dispatches room_invite into the same slice.
        */}
        <InviteBanner />
        {/* the tab keeps counting while you are in a match */}
        <UnreadIndicator />
      </div>
    </GameProvider>
  );
}
